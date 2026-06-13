import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SHIFT_CATEGORIES, type ShiftCategory } from "./src/lib/constants";
import { categoryLabel, dayOfWeekFromDate, formatShortDate, formatTime, statusLabel } from "./src/lib/format";
import { supabase } from "./src/lib/supabase";
import type { Airport, Company, Notification, Profile, ShiftPost, ShiftRequest, Station } from "./src/types";

type TabKey = "dashboard" | "myPosts" | "newPost" | "notifications" | "profile";
type AuthMode = "login" | "signup";
type DirectoryData = { companies: Company[]; airports: Airport[]; stations: Station[] };
type PostFormState = {
  category: ShiftCategory;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  location_team: string;
  notes: string;
  status: "open" | "closed";
};

const postColumns =
  "id,user_id,station_id,airport_id,company_id,poster_name_snapshot,category,shift_date,day_of_week,shift_start,shift_end,location_team,notes,status,created_at";

const today = new Date().toISOString().slice(0, 10);

const emptyPostForm: PostFormState = {
  category: "pick_up",
  shift_date: today,
  shift_start: "09:00",
  shift_end: "17:00",
  location_team: "",
  notes: "",
  status: "open",
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [directory, setDirectory] = useState<DirectoryData>({ companies: [], airports: [], stations: [] });
  const [posts, setPosts] = useState<ShiftPost[]>([]);
  const [myPosts, setMyPosts] = useState<ShiftPost[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabKey>("dashboard");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<ShiftPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");

  const unreadCount = notifications.filter((notification) => !notification.read_at).length;
  const selectedPost = useMemo(
    () => [...posts, ...myPosts].find((post) => post.id === selectedPostId) ?? null,
    [myPosts, posts, selectedPostId],
  );

  const loadDirectory = useCallback(async () => {
    const [companiesResult, airportsResult, stationsResult] = await Promise.all([
      supabase.from("companies").select("id,name,is_other").order("is_other").order("name"),
      supabase.from("airports").select("id,iata_code,name,city,state").order("iata_code"),
      supabase.from("stations").select("id,airport_id,name,description").order("name"),
    ]);

    setDirectory({
      companies: (companiesResult.data ?? []) as Company[],
      airports: (airportsResult.data ?? []) as Airport[],
      stations: (stationsResult.data ?? []) as Station[],
    });
  }, []);

  const loadProfile = useCallback(async (activeSession: Session | null = session) => {
    if (!activeSession?.user.id) {
      setProfile(null);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*, companies(name), airports(iata_code,name,city,state), stations(name)")
      .eq("id", activeSession.user.id)
      .single();

    if (error) {
      setMessage(error.message);
      return null;
    }

    setProfile(data as Profile);
    return data as Profile;
  }, [session]);

  const loadAppData = useCallback(
    async (activeSession: Session | null = session, activeProfile: Profile | null = profile) => {
      if (!activeSession?.user.id || !activeProfile?.station_id) {
        setPosts([]);
        setMyPosts([]);
        setNotifications([]);
        return;
      }

      const [postsResult, myPostsResult, notificationsResult] = await Promise.all([
        supabase
          .from("shift_posts")
          .select(postColumns)
          .eq("station_id", activeProfile.station_id)
          .order("shift_date", { ascending: true })
          .order("shift_start", { ascending: true }),
        supabase.from("shift_posts").select(postColumns).eq("user_id", activeSession.user.id).order("created_at", { ascending: false }),
        supabase.from("notifications").select("id,title,body,type,read_at,created_at,shift_post_id").eq("user_id", activeSession.user.id).order("created_at", { ascending: false }),
      ]);

      if (postsResult.error || myPostsResult.error || notificationsResult.error) {
        setMessage(postsResult.error?.message ?? myPostsResult.error?.message ?? notificationsResult.error?.message ?? "Unable to load app data.");
      }

      setPosts((postsResult.data ?? []) as ShiftPost[]);
      setMyPosts((myPostsResult.data ?? []) as ShiftPost[]);
      setNotifications((notificationsResult.data ?? []) as Notification[]);
    },
    [profile, session],
  );

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    const activeProfile = await loadProfile();
    await loadDirectory();
    await loadAppData(session, activeProfile);
    setRefreshing(false);
  }, [loadAppData, loadDirectory, loadProfile, session]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadDirectory();
      const activeProfile = await loadProfile(data.session);
      await loadAppData(data.session, activeProfile);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
        setPosts([]);
        setMyPosts([]);
        setNotifications([]);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadAppData, loadDirectory, loadProfile]);

  async function afterAuth(nextSession: Session | null) {
    setSession(nextSession);
    const activeProfile = await loadProfile(nextSession);
    await loadDirectory();
    await loadAppData(nextSession, activeProfile);
  }

  if (loading) {
    return (
      <Shell>
        <Centered>
          <ActivityIndicator color="#0f766e" size="large" />
          <Text style={styles.muted}>Loading Tradevya...</Text>
        </Centered>
      </Shell>
    );
  }

  if (!session) {
    return (
      <Shell>
        <AuthScreen modeMessage={message} onAuth={afterAuth} onMessage={setMessage} />
      </Shell>
    );
  }

  if (!session.user.email_confirmed_at || !profile?.email_verified_at) {
    return (
      <Shell>
        <Centered>
          <Text style={styles.title}>Verify your work email</Text>
          <Text style={styles.bodyText}>Open the verification email, then come back and refresh Tradevya.</Text>
          <ActionButton label="Refresh" onPress={refreshAll} />
          <GhostButton label="Sign out" onPress={() => supabase.auth.signOut()} />
        </Centered>
      </Shell>
    );
  }

  if (profile.blocked_at || profile.disabled_at) {
    return (
      <Shell>
        <Centered>
          <Text style={styles.title}>Account access paused</Text>
          <Text style={styles.bodyText}>Your Tradevya account is not currently active. Contact your administrator for help.</Text>
          <GhostButton label="Sign out" onPress={() => supabase.auth.signOut()} />
        </Centered>
      </Shell>
    );
  }

  if (!profile.company_id || !profile.airport_id || !profile.station_id) {
    return (
      <Shell>
        <LocationSetup
          directory={directory}
          profile={profile}
          refreshAll={refreshAll}
          setMessage={setMessage}
        />
      </Shell>
    );
  }

  if (editingPost) {
    return (
      <Shell>
        <PostFormScreen
          mode="edit"
          post={editingPost}
          profile={profile}
          session={session}
          onCancel={() => setEditingPost(null)}
          onDone={async () => {
            setEditingPost(null);
            await refreshAll();
          }}
          setMessage={setMessage}
        />
      </Shell>
    );
  }

  if (selectedPostId) {
    return (
      <Shell>
        <PostDetailScreen
          currentUserId={session.user.id}
          post={selectedPost}
          postId={selectedPostId}
          profile={profile}
          refreshAll={refreshAll}
          onBack={() => setSelectedPostId(null)}
          onEdit={(post) => setEditingPost(post)}
          setMessage={setMessage}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <View style={styles.header}>
        <View>
          <Text style={styles.appName}>Tradevya</Text>
          <Text style={styles.headerMeta}>
            {profile.airports?.iata_code ?? "Airport"} / {profile.stations?.name ?? "Station"}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{unreadCount} alerts</Text>
        </View>
      </View>

      {message ? (
        <Pressable onPress={() => setMessage("")} style={styles.message}>
          <Text style={styles.messageText}>{message}</Text>
        </Pressable>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor="#0f766e" />}
      >
        {selectedTab === "dashboard" ? <DashboardScreen posts={posts} openPost={setSelectedPostId} /> : null}
        {selectedTab === "myPosts" ? (
          <MyPostsScreen
            posts={myPosts}
            openPost={setSelectedPostId}
            onDelete={(post) => deleteOwnPost(post, refreshAll, setMessage)}
            onEdit={setEditingPost}
          />
        ) : null}
        {selectedTab === "newPost" ? (
          <PostFormScreen
            mode="create"
            profile={profile}
            session={session}
            onCancel={() => setSelectedTab("dashboard")}
            onDone={async () => {
              setSelectedTab("myPosts");
              await refreshAll();
            }}
            setMessage={setMessage}
          />
        ) : null}
        {selectedTab === "notifications" ? (
          <NotificationsScreen notifications={notifications} openPost={setSelectedPostId} refreshAll={refreshAll} setMessage={setMessage} />
        ) : null}
        {selectedTab === "profile" ? <ProfileScreen profile={profile} refreshAll={refreshAll} /> : null}
      </ScrollView>

      <TabBar selectedTab={selectedTab} setSelectedTab={setSelectedTab} unreadCount={unreadCount} />
      <StatusBar style="dark" />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.centered}>{children}</View>;
}

function AuthScreen({
  modeMessage,
  onAuth,
  onMessage,
}: {
  modeMessage: string;
  onAuth: (session: Session | null) => Promise<void>;
  onMessage: (message: string) => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    onMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim() } },
          });

    setBusy(false);

    if (result.error) {
      onMessage(result.error.message);
      return;
    }

    if (mode === "signup") {
      onMessage("Check your work email to verify the account, then log in.");
    }

    await onAuth(result.data.session);
  }

  return (
    <ScrollView contentContainerStyle={styles.authWrap}>
      <Text style={styles.eyebrow}>Work email required</Text>
      <Text style={styles.heroTitle}>{mode === "login" ? "Log in" : "Create account"}</Text>
      <Text style={styles.bodyText}>Trade shifts with verified coworkers in your company, airport, and station.</Text>

      {modeMessage ? <Text style={styles.inlineError}>{modeMessage}</Text> : null}

      {mode === "signup" ? (
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
      ) : null}
      <Field label="Work email" value={email} onChangeText={setEmail} placeholder="name@company.com" autoCapitalize="none" keyboardType="email-address" />
      <Field label="Password" value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />

      <ActionButton disabled={busy} label={busy ? "Working..." : mode === "login" ? "Log in" : "Sign up"} onPress={submit} />
      <GhostButton
        label={mode === "login" ? "Create a new account" : "I already have an account"}
        onPress={() => {
          onMessage("");
          setMode(mode === "login" ? "signup" : "login");
        }}
      />
    </ScrollView>
  );
}

function LocationSetup({
  directory,
  profile,
  refreshAll,
  setMessage,
}: {
  directory: DirectoryData;
  profile: Profile;
  refreshAll: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [companyId, setCompanyId] = useState(profile.company_id ?? directory.companies[0]?.id ?? "");
  const [airportId, setAirportId] = useState(profile.airport_id ?? directory.airports[0]?.id ?? "");
  const airportStations = directory.stations.filter((station) => station.airport_id === airportId);
  const [stationId, setStationId] = useState(profile.station_id ?? airportStations[0]?.id ?? "");
  const [customCompany, setCustomCompany] = useState(profile.custom_company_name ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const nextStations = directory.stations.filter((station) => station.airport_id === airportId);
    if (!nextStations.some((station) => station.id === stationId)) {
      setStationId(nextStations[0]?.id ?? "");
    }
  }, [airportId, directory.stations, stationId]);

  async function save() {
    if (!fullName.trim() || !companyId || !airportId || !stationId) {
      setMessage("Choose your name, company, airport, and station.");
      return;
    }

    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        company_id: companyId,
        custom_company_name: customCompany.trim() || null,
        airport_id: airportId,
        station_id: stationId,
      })
      .eq("id", profile.id);

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await refreshAll();
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Location setup</Text>
      <Text style={styles.title}>Finish your profile</Text>
      <Text style={styles.bodyText}>Tradevya uses your airport and station to keep posts in the right place.</Text>

      <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
      <ChoiceGroup label="Company" choices={directory.companies.map((company) => ({ id: company.id, label: company.name }))} value={companyId} onChange={setCompanyId} />
      <Field label="Custom company name" value={customCompany} onChangeText={setCustomCompany} placeholder="Optional" />
      <ChoiceGroup
        label="Airport"
        choices={directory.airports.map((airport) => ({ id: airport.id, label: `${airport.iata_code} - ${airport.city}, ${airport.state}` }))}
        value={airportId}
        onChange={setAirportId}
      />
      <ChoiceGroup label="Station" choices={airportStations.map((station) => ({ id: station.id, label: station.name }))} value={stationId} onChange={setStationId} />
      <ActionButton disabled={busy} label={busy ? "Saving..." : "Save profile"} onPress={save} />
      <GhostButton label="Sign out" onPress={() => supabase.auth.signOut()} />
    </ScrollView>
  );
}

function DashboardScreen({ posts, openPost }: { posts: ShiftPost[]; openPost: (postId: string) => void }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>All posts</Text>
      <Text style={styles.muted}>Open and pending station posts appear here.</Text>
      <PostList emptyText="No station posts yet." posts={posts} openPost={openPost} />
    </View>
  );
}

function MyPostsScreen({
  posts,
  openPost,
  onDelete,
  onEdit,
}: {
  posts: ShiftPost[];
  openPost: (postId: string) => void;
  onDelete: (post: ShiftPost) => void;
  onEdit: (post: ShiftPost) => void;
}) {
  return (
    <View>
      <Text style={styles.sectionTitle}>My posts</Text>
      <Text style={styles.muted}>Edit or remove your own shift posts when plans change.</Text>
      <PostList emptyText="You have not posted yet." posts={posts} openPost={openPost} onDelete={onDelete} onEdit={onEdit} />
    </View>
  );
}

function PostList({
  emptyText,
  posts,
  openPost,
  onDelete,
  onEdit,
}: {
  emptyText: string;
  posts: ShiftPost[];
  openPost: (postId: string) => void;
  onDelete?: (post: ShiftPost) => void;
  onEdit?: (post: ShiftPost) => void;
}) {
  if (!posts.length) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View style={styles.list}>
      {posts.map((post, index) => (
        <Pressable key={post.id} onPress={() => openPost(post.id)} style={[styles.card, index % 2 === 0 ? styles.cardBlue : styles.cardWhite]}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>{categoryLabel(post.category)}</Text>
            <Text style={styles.statusPill}>{statusLabel(post.status)}</Text>
          </View>
          <Text style={styles.cardLine}>
            {formatShortDate(post.shift_date)} {post.day_of_week} {formatTime(post.shift_start)} to {formatTime(post.shift_end)}
          </Text>
          <Text style={styles.cardAction}>Tap for details</Text>
          {post.location_team ? <Text style={styles.cardMeta}>Location: {post.location_team}</Text> : null}
          {onEdit || onDelete ? (
            <View style={styles.row}>
              {onEdit ? <SmallButton label="Edit" onPress={() => onEdit(post)} /> : null}
              {onDelete ? <DangerSmallButton label="Delete" onPress={() => onDelete(post)} /> : null}
            </View>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

function PostDetailScreen({
  currentUserId,
  post,
  postId,
  profile,
  refreshAll,
  onBack,
  onEdit,
  setMessage,
}: {
  currentUserId: string;
  post: ShiftPost | null;
  postId: string;
  profile: Profile;
  refreshAll: () => Promise<void>;
  onBack: () => void;
  onEdit: (post: ShiftPost) => void;
  setMessage: (message: string) => void;
}) {
  const [loadedPost, setLoadedPost] = useState<ShiftPost | null>(post);
  const [requests, setRequests] = useState<ShiftRequest[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const activePost = loadedPost ?? post;
  const isOwner = activePost?.user_id === currentUserId;

  useEffect(() => {
    async function loadDetail() {
      const { data, error } = await supabase.from("shift_posts").select(postColumns).eq("id", postId).single();
      if (error) {
        setMessage(error.message);
        return;
      }

      const nextPost = data as ShiftPost;
      setLoadedPost(nextPost);

      if (nextPost.user_id === currentUserId) {
        const requestsResult = await supabase
          .from("shift_requests")
          .select("id,requester_id,request_type,proposed_shift_date,proposed_start_time,proposed_end_time,message,status,created_at")
          .eq("shift_post_id", nextPost.id)
          .order("created_at", { ascending: false });
        setRequests((requestsResult.data ?? []) as ShiftRequest[]);
      }
    }

    loadDetail();
  }, [currentUserId, postId, setMessage]);

  async function submitRequest() {
    if (!activePost) return;
    setBusy(true);

    const requestType = activePost.category === "day_trade" ? "trade_proposal" : "take_shift";
    const { data: request, error } = await supabase
      .from("shift_requests")
      .insert({
        shift_post_id: activePost.id,
        requester_id: currentUserId,
        request_type: requestType,
        message: requestMessage.trim() || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (!error) {
      await supabase.from("shift_posts").update({ status: "pending" }).eq("id", activePost.id);
      if (activePost.user_id) {
        await supabase.from("notifications").insert({
          user_id: activePost.user_id,
          actor_id: currentUserId,
          type: "shift_request_submitted",
          title: "New shift request",
          body: `${profile.full_name || "A station coworker"} requested your ${activePost.day_of_week} shift.`,
          shift_post_id: activePost.id,
          shift_request_id: request?.id,
        });
      }
    }

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRequestMessage("");
    await refreshAll();
    onBack();
  }

  async function respond(request: ShiftRequest, response: "approved" | "declined") {
    if (!activePost) return;
    setBusy(true);
    const { error } = await supabase
      .from("shift_requests")
      .update({ status: response, responder_id: currentUserId, responded_at: new Date().toISOString() })
      .eq("id", request.id);

    if (!error) {
      await supabase.from("shift_posts").update({ status: response === "approved" ? "approved" : "open" }).eq("id", activePost.id);
      await supabase.from("notifications").insert({
        user_id: request.requester_id,
        actor_id: currentUserId,
        type: response === "approved" ? "shift_request_approved" : "shift_request_declined",
        title: response === "approved" ? "Request approved" : "Request declined",
        body: response === "approved" ? "Your shift request was approved." : "Your shift request was declined.",
        shift_post_id: activePost.id,
        shift_request_id: request.id,
      });
    }

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await refreshAll();
    onBack();
  }

  if (!activePost) {
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <GhostButton label="Back" onPress={onBack} />
        <Text style={styles.empty}>Post not found.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <GhostButton label="Back" onPress={onBack} />
      <View style={styles.detailCard}>
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{categoryLabel(activePost.category)}</Text>
          <Text style={styles.statusPill}>{statusLabel(activePost.status)}</Text>
        </View>
        <Text style={styles.title}>{activePost.day_of_week} shift</Text>
        <Text style={styles.cardLine}>
          {formatShortDate(activePost.shift_date)} / {formatTime(activePost.shift_start)} to {formatTime(activePost.shift_end)}
        </Text>
        <Text style={styles.bodyText}>Location: {activePost.location_team || "Station area"}</Text>
        {activePost.notes ? <Text style={styles.note}>{activePost.notes}</Text> : null}
      </View>

      {isOwner ? (
        <View style={styles.panel}>
          <ActionButton label="Edit this post" onPress={() => onEdit(activePost)} />
          <Text style={styles.sectionTitle}>Requests</Text>
          {requests.length ? (
            requests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <Text style={styles.cardTitle}>{statusLabel(request.status)}</Text>
                {request.message ? <Text style={styles.bodyText}>{request.message}</Text> : null}
                {request.status === "pending" ? (
                  <View style={styles.row}>
                    <SmallButton disabled={busy} label="Approve" onPress={() => respond(request, "approved")} />
                    <DangerSmallButton disabled={busy} label="Decline" onPress={() => respond(request, "declined")} />
                  </View>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No requests yet.</Text>
          )}
        </View>
      ) : activePost.status === "approved" || activePost.status === "closed" ? (
        <Text style={styles.empty}>This post is no longer open for requests.</Text>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.sectionTitle}>Request this shift</Text>
          <Field label="Message" value={requestMessage} onChangeText={setRequestMessage} placeholder="Add a short note" multiline />
          <ActionButton disabled={busy} label={busy ? "Sending..." : "Submit request"} onPress={submitRequest} />
        </View>
      )}
    </ScrollView>
  );
}

function PostFormScreen({
  mode,
  post,
  profile,
  session,
  onCancel,
  onDone,
  setMessage,
}: {
  mode: "create" | "edit";
  post?: ShiftPost | null;
  profile: Profile;
  session: Session;
  onCancel: () => void;
  onDone: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  const [form, setForm] = useState<PostFormState>(
    post
      ? {
          category: post.category as ShiftCategory,
          shift_date: post.shift_date,
          shift_start: post.shift_start.slice(0, 5),
          shift_end: post.shift_end.slice(0, 5),
          location_team: post.location_team ?? "",
          notes: post.notes ?? "",
          status: post.status === "closed" ? "closed" : "open",
        }
      : emptyPostForm,
  );
  const [busy, setBusy] = useState(false);

  function patch(next: Partial<PostFormState>) {
    setForm((current) => ({ ...current, ...next }));
  }

  async function save() {
    if (!profile.station_id || !profile.airport_id || !form.shift_date || !form.shift_start || !form.shift_end) {
      setMessage("Complete the post date, time, airport, and station.");
      return;
    }

    setBusy(true);
    const payload = {
      category: form.category,
      shift_date: form.shift_date,
      day_of_week: dayOfWeekFromDate(form.shift_date),
      shift_start: form.shift_start,
      shift_end: form.shift_end,
      location_team: form.location_team.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    const result =
      mode === "create"
        ? await supabase.from("shift_posts").insert({
            ...payload,
            user_id: session.user.id,
            company_id: profile.company_id,
            airport_id: profile.airport_id,
            station_id: profile.station_id,
            poster_name_snapshot: profile.full_name || session.user.email || "Tradevya member",
          })
        : await supabase.from("shift_posts").update(payload).eq("id", post?.id).eq("user_id", session.user.id);

    setBusy(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    await onDone();
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <GhostButton label="Cancel" onPress={onCancel} />
      <Text style={styles.sectionTitle}>{mode === "create" ? "New post" : "Edit post"}</Text>
      <ChoiceGroup
        label="Category"
        choices={SHIFT_CATEGORIES.map((category) => ({ id: category.value, label: category.label }))}
        value={form.category}
        onChange={(value) => patch({ category: value as ShiftCategory })}
      />
      {mode === "edit" ? (
        <ChoiceGroup
          label="Status"
          choices={[
            { id: "open", label: "Open" },
            { id: "closed", label: "Closed" },
          ]}
          value={form.status}
          onChange={(value) => patch({ status: value as "open" | "closed" })}
        />
      ) : null}
      <Field label="Date" value={form.shift_date} onChangeText={(value) => patch({ shift_date: value })} placeholder="YYYY-MM-DD" />
      <View style={styles.twoColumns}>
        <Field label="Start" value={form.shift_start} onChangeText={(value) => patch({ shift_start: value })} placeholder="09:00" />
        <Field label="End" value={form.shift_end} onChangeText={(value) => patch({ shift_end: value })} placeholder="17:00" />
      </View>
      <Field label="Location" value={form.location_team} onChangeText={(value) => patch({ location_team: value })} placeholder="Gate, ramp, bag room, etc." />
      <Field label="Notes" value={form.notes} onChangeText={(value) => patch({ notes: value })} placeholder="Details coworkers should know" multiline />
      <ActionButton disabled={busy} label={busy ? "Saving..." : "Save post"} onPress={save} />
    </ScrollView>
  );
}

function NotificationsScreen({
  notifications,
  openPost,
  refreshAll,
  setMessage,
}: {
  notifications: Notification[];
  openPost: (postId: string) => void;
  refreshAll: () => Promise<void>;
  setMessage: (message: string) => void;
}) {
  async function markRead(notification: Notification) {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notification.id);
    if (error) {
      setMessage(error.message);
      return;
    }
    await refreshAll();
  }

  return (
    <View>
      <Text style={styles.sectionTitle}>Notifications</Text>
      {notifications.length ? (
        notifications.map((notification) => (
          <Pressable
            key={notification.id}
            onPress={() => {
              if (notification.shift_post_id) openPost(notification.shift_post_id);
            }}
            style={[styles.card, !notification.read_at ? styles.alertCard : styles.cardWhite]}
          >
            <Text style={styles.cardTitle}>{notification.title}</Text>
            {notification.body ? <Text style={styles.bodyText}>{notification.body}</Text> : null}
            {!notification.read_at ? <SmallButton label="Mark read" onPress={() => markRead(notification)} /> : null}
          </Pressable>
        ))
      ) : (
        <Text style={styles.empty}>No notifications yet.</Text>
      )}
    </View>
  );
}

function ProfileScreen({ profile, refreshAll }: { profile: Profile; refreshAll: () => Promise<void> }) {
  const company = profile.custom_company_name || profile.companies?.name || "Company pending";

  return (
    <View>
      <Text style={styles.sectionTitle}>Profile</Text>
      <View style={styles.detailCard}>
        <Text style={styles.title}>{profile.full_name || "Tradevya member"}</Text>
        <Text style={styles.bodyText}>{profile.email}</Text>
        <Text style={styles.bodyText}>Company: {company}</Text>
        <Text style={styles.bodyText}>Airport: {profile.airports?.iata_code ?? "Pending"}</Text>
        <Text style={styles.bodyText}>Station: {profile.stations?.name ?? "Pending"}</Text>
      </View>
      <ActionButton label="Refresh profile" onPress={refreshAll} />
      <DangerButton label="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

function TabBar({
  selectedTab,
  setSelectedTab,
  unreadCount,
}: {
  selectedTab: TabKey;
  setSelectedTab: (tab: TabKey) => void;
  unreadCount: number;
}) {
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "dashboard", label: "Home" },
    { key: "myPosts", label: "My Posts" },
    { key: "newPost", label: "+" },
    { key: "notifications", label: unreadCount ? `Alerts ${unreadCount}` : "Alerts" },
    { key: "profile", label: "Profile" },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          onPress={() => setSelectedTab(tab.key)}
          style={[styles.tabItem, tab.key === "newPost" ? styles.postTab : null, selectedTab === tab.key ? styles.activeTab : null]}
        >
          <Text style={[styles.tabText, selectedTab === tab.key ? styles.activeTabText : null]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ChoiceGroup({
  label,
  choices,
  value,
  onChange,
}: {
  label: string;
  choices: Array<{ id: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.choiceRow}>
          {choices.map((choice) => (
            <Pressable key={choice.id} onPress={() => onChange(choice.id)} style={[styles.choice, value === choice.id ? styles.choiceActive : null]}>
              <Text style={[styles.choiceText, value === choice.id ? styles.choiceTextActive : null]}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  ...inputProps
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        style={[styles.input, multiline ? styles.textArea : null]}
        value={value}
      />
    </View>
  );
}

function ActionButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.button, disabled ? styles.disabledButton : null]}>
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

function DangerButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.dangerButton}>
      <Text style={styles.dangerButtonText}>{label}</Text>
    </Pressable>
  );
}

function GhostButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ghostButton}>
      <Text style={styles.ghostButtonText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.smallButton, disabled ? styles.disabledButton : null]}>
      <Text style={styles.smallButtonText}>{label}</Text>
    </Pressable>
  );
}

function DangerSmallButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.dangerSmallButton, disabled ? styles.disabledButton : null]}>
      <Text style={styles.dangerSmallButtonText}>{label}</Text>
    </Pressable>
  );
}

function deleteOwnPost(post: ShiftPost, refreshAll: () => Promise<void>, setMessage: (message: string) => void) {
  Alert.alert("Delete post?", "This removes the post and any related requests.", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        const { error } = await supabase.from("shift_posts").delete().eq("id", post.id);
        if (error) {
          setMessage(error.message);
          return;
        }
        await refreshAll();
      },
    },
  ]);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8f7",
  },
  keyboard: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderBottomColor: "#e4e4e7",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  appName: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  headerMeta: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  headerBadge: {
    backgroundColor: "#fee2e2",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeText: {
    color: "#b91c1c",
    fontSize: 12,
    fontWeight: "900",
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 104,
  },
  authWrap: {
    gap: 14,
    padding: 22,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    gap: 14,
    justifyContent: "center",
    padding: 24,
  },
  eyebrow: {
    color: "#0f766e",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#0f172a",
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    color: "#0f172a",
    fontSize: 24,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#0f172a",
    fontSize: 22,
    fontWeight: "900",
  },
  bodyText: {
    color: "#52525b",
    fontSize: 15,
    lineHeight: 22,
  },
  muted: {
    color: "#71717a",
    fontSize: 13,
    fontWeight: "600",
  },
  inlineError: {
    backgroundColor: "#fee2e2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "700",
    padding: 10,
  },
  message: {
    backgroundColor: "#ecfeff",
    borderBottomColor: "#99f6e4",
    borderBottomWidth: 1,
    padding: 10,
  },
  messageText: {
    color: "#115e59",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  fieldWrap: {
    gap: 7,
  },
  label: {
    color: "#3f3f46",
    fontSize: 13,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#ffffff",
    borderColor: "#d4d4d8",
    borderRadius: 8,
    borderWidth: 1,
    color: "#18181b",
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 8,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  dangerButton: {
    alignItems: "center",
    backgroundColor: "#be123c",
    borderRadius: 8,
    minHeight: 50,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  dangerButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  ghostButton: {
    alignItems: "center",
    borderColor: "#d4d4d8",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  ghostButtonText: {
    color: "#3f3f46",
    fontSize: 14,
    fontWeight: "900",
  },
  smallButton: {
    alignItems: "center",
    backgroundColor: "#0f766e",
    borderRadius: 7,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  dangerSmallButton: {
    alignItems: "center",
    backgroundColor: "#be123c",
    borderRadius: 7,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  dangerSmallButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "900",
  },
  choiceRow: {
    flexDirection: "row",
    gap: 8,
    paddingRight: 16,
  },
  choice: {
    backgroundColor: "#ffffff",
    borderColor: "#d4d4d8",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceActive: {
    backgroundColor: "#0f766e",
    borderColor: "#0f766e",
  },
  choiceText: {
    color: "#3f3f46",
    fontSize: 13,
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#ffffff",
  },
  list: {
    gap: 10,
    marginTop: 12,
  },
  card: {
    borderColor: "#e4e4e7",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  cardBlue: {
    backgroundColor: "#eff6ff",
  },
  cardWhite: {
    backgroundColor: "#ffffff",
  },
  alertCard: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
  },
  cardTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  cardTitle: {
    color: "#0f172a",
    flex: 1,
    fontSize: 16,
    fontWeight: "900",
  },
  statusPill: {
    backgroundColor: "#dcfce7",
    borderRadius: 6,
    color: "#166534",
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardLine: {
    color: "#3f3f46",
    fontSize: 14,
    fontWeight: "800",
  },
  cardAction: {
    color: "#0369a1",
    fontSize: 12,
    fontWeight: "900",
  },
  cardMeta: {
    color: "#71717a",
    fontSize: 12,
    fontWeight: "700",
  },
  detailCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  note: {
    backgroundColor: "#f4f4f5",
    borderRadius: 8,
    color: "#3f3f46",
    fontSize: 14,
    lineHeight: 21,
    padding: 12,
  },
  panel: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e4e4e7",
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  empty: {
    backgroundColor: "#ffffff",
    borderColor: "#d4d4d8",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    color: "#71717a",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    padding: 16,
    textAlign: "center",
  },
  tabBar: {
    alignItems: "flex-end",
    backgroundColor: "#ffffff",
    borderTopColor: "#e4e4e7",
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: "row",
    gap: 4,
    justifyContent: "space-around",
    left: 0,
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 10,
    position: "absolute",
    right: 0,
  },
  tabItem: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#f0fdfa",
  },
  postTab: {
    backgroundColor: "#0f766e",
    borderRadius: 999,
    flex: 0,
    height: 58,
    marginBottom: 8,
    width: 58,
  },
  tabText: {
    color: "#52525b",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center",
  },
  activeTabText: {
    color: "#0f766e",
  },
});
