import { useEffect, useState } from "react";
import "./App.css";
import API from "./api";

function App() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] =
    useState(null);

  const [activePage, setActivePage] =
    useState("home");

  const [newPost, setNewPost] = useState("");
  const [commentText, setCommentText] =
    useState({});

  // Post menu / edit states
  const [openMenu, setOpenMenu] =
    useState(null);
  const [editingPost, setEditingPost] =
    useState(null);
  const [editText, setEditText] =
    useState("");

  // Comment menu
  const [openCommentMenu, setOpenCommentMenu] =
    useState(null);

  const [authMode, setAuthMode] =
    useState("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [registerName, setRegisterName] =
    useState("");
  const [registerUsername, setRegisterUsername] =
    useState("");
  const [registerEmail, setRegisterEmail] =
    useState("");
  const [registerPassword, setRegisterPassword] =
    useState("");
  const [registerBio, setRegisterBio] =
    useState("");

  const [loading, setLoading] =
    useState(false);
  const [message, setMessage] =
    useState("");

  // ==========================================
  // GET TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem(
      "connecthub_token"
    );
  };

  // ==========================================
  // LOAD USERS + POSTS
  // ==========================================

  const loadData = async (
    userId = null
  ) => {
    try {
      const [
        usersResponse,
        postsResponse,
      ] = await Promise.all([
        API.get("/auth/users"),
        API.get("/posts"),
      ]);

      const loadedUsers =
        usersResponse.data.users || [];

      const loadedPosts =
        postsResponse.data.posts || [];

      setUsers(loadedUsers);
      setPosts(loadedPosts);

      const savedUserId =
        userId ||
        localStorage.getItem(
          "connecthub_userId"
        );

      if (savedUserId) {
        const loggedUser =
          loadedUsers.find(
            (user) =>
              user._id.toString() ===
              savedUserId.toString()
          );

        if (loggedUser) {
          setCurrentUser(loggedUser);
        }
      }
    } catch (error) {
      console.error(
        "Load data error:",
        error
      );
    }
  };

  // ==========================================
  // CHECK LOGIN
  // ==========================================

  useEffect(() => {
    const token = getToken();

    const savedUserId =
      localStorage.getItem(
        "connecthub_userId"
      );

    if (token && savedUserId) {
      loadData(savedUserId);
    }
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response =
        await API.post(
          "/auth/login",
          {
            email,
            password,
          }
        );

      const { token, user } =
        response.data;

      localStorage.setItem(
        "connecthub_token",
        token
      );

      localStorage.setItem(
        "connecthub_userId",
        user.id
      );

      setEmail("");
      setPassword("");

      await loadData(user.id);

      setMessage(
        "Login successful! 🎉"
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setMessage(
        error.response?.data
          ?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleRegister = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response =
        await API.post(
          "/auth/register",
          {
            name: registerName,
            username:
              registerUsername,
            email: registerEmail,
            password:
              registerPassword,
            bio: registerBio,
          }
        );

      const { token, user } =
        response.data;

      localStorage.setItem(
        "connecthub_token",
        token
      );

      localStorage.setItem(
        "connecthub_userId",
        user.id
      );

      setRegisterName("");
      setRegisterUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterBio("");

      await loadData(user.id);

      setMessage(
        "Registration successful! 🎉"
      );
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setMessage(
        error.response?.data
          ?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem(
      "connecthub_token"
    );

    localStorage.removeItem(
      "connecthub_userId"
    );

    setCurrentUser(null);
    setUsers([]);
    setPosts([]);
    setActivePage("home");
    setOpenMenu(null);
    setOpenCommentMenu(null);
  };

  // ==========================================
  // CREATE POST
  // ==========================================

  const handleCreatePost =
    async () => {
      if (!newPost.trim()) {
        return;
      }

      try {
        const response =
          await API.post(
            "/posts",
            {
              text: newPost.trim(),
            },
            {
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            }
          );

        setPosts([
          response.data.post,
          ...posts,
        ]);

        setNewPost("");
      } catch (error) {
        console.error(
          "Create post error:",
          error
        );

        if (
          error.response?.status ===
          401
        ) {
          handleLogout();
        }
      }
    };

  // ==========================================
  // LIKE / UNLIKE
  // ==========================================

  const handleLike = async (
    postId
  ) => {
    try {
      const response =
        await API.put(
          `/posts/${postId}/like`,
          {},
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

      setPosts(
        posts.map((post) => {
          if (post._id !== postId) {
            return post;
          }

          let updatedLikes = [
            ...(post.likes || []),
          ];

          if (response.data.liked) {
            updatedLikes.push(
              currentUser._id
            );
          } else {
            updatedLikes =
              updatedLikes.filter(
                (id) =>
                  id.toString() !==
                  currentUser._id.toString()
              );
          }

          return {
            ...post,
            likes: updatedLikes,
          };
        })
      );
    } catch (error) {
      console.error(
        "Like error:",
        error
      );
    }
  };

  // ==========================================
  // ADD COMMENT
  // ==========================================

  const handleComment = async (
    postId
  ) => {
    const text =
      commentText[postId];

    if (
      !text ||
      !text.trim()
    ) {
      return;
    }

    try {
      const response =
        await API.post(
          `/posts/${postId}/comments`,
          {
            text: text.trim(),
          },
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

      setPosts(
        posts.map((post) =>
          post._id === postId
            ? response.data.post
            : post
        )
      );

      setCommentText({
        ...commentText,
        [postId]: "",
      });
    } catch (error) {
      console.error(
        "Comment error:",
        error
      );
    }
  };

  // ==========================================
  // DELETE COMMENT
  // ==========================================

  const handleDeleteComment =
    async (
      postId,
      commentId
    ) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this comment?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        const response =
          await API.delete(
            `/posts/${postId}/comments/${commentId}`,
            {
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            }
          );

        setPosts(
          posts.map((post) =>
            post._id === postId
              ? response.data.post
              : post
          )
        );

        setOpenCommentMenu(null);
      } catch (error) {
        console.error(
          "Delete comment error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to delete comment"
        );
      }
    };

  // ==========================================
  // FOLLOW / UNFOLLOW
  // ==========================================

  const handleFollow = async (
    userId
  ) => {
    try {
      await API.put(
        `/auth/follow/${userId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      await loadData(
        localStorage.getItem(
          "connecthub_userId"
        )
      );
    } catch (error) {
      console.error(
        "Follow error:",
        error
      );
    }
  };

  // ==========================================
  // EDIT POST
  // ==========================================

  const handleEditPost =
    async () => {
      if (
        !editingPost ||
        !editText.trim()
      ) {
        return;
      }

      try {
        const response =
          await API.put(
            `/posts/${editingPost._id}`,
            {
              text: editText.trim(),
            },
            {
              headers: {
                Authorization: `Bearer ${getToken()}`,
              },
            }
          );

        setPosts(
          posts.map((post) =>
            post._id ===
            editingPost._id
              ? response.data.post
              : post
          )
        );

        setEditingPost(null);
        setEditText("");
        setOpenMenu(null);
      } catch (error) {
        console.error(
          "Edit post error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to edit post"
        );
      }
    };

  // ==========================================
  // DELETE POST
  // ==========================================

  const handleDeletePost =
    async (postId) => {
      const confirmDelete =
        window.confirm(
          "Are you sure you want to delete this post?"
        );

      if (!confirmDelete) {
        return;
      }

      try {
        await API.delete(
          `/posts/${postId}`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );

        setPosts(
          posts.filter(
            (post) =>
              post._id !== postId
          )
        );

        setOpenMenu(null);
      } catch (error) {
        console.error(
          "Delete post error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Unable to delete post"
        );
      }
    };

  // ==========================================
  // REPORT POST
  // ==========================================

  const handleReportPost = () => {
    alert(
      "Thanks! The post has been reported. 🚩"
    );

    setOpenMenu(null);
  };

  // ==========================================
  // AUTH SCREEN
  // ==========================================

  if (!currentUser) {
    return (
      <div className="app">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            padding: "20px",
            background:
              "linear-gradient(135deg, #eef2ff, #f8fafc)",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "430px",
              padding: "35px",
            }}
          >
            <div
              style={{
                textAlign:
                  "center",
                marginBottom:
                  "25px",
              }}
            >
              <div
                className="logo-icon"
                style={{
                  margin:
                    "0 auto 10px",
                }}
              >
                C
              </div>

              <h1>
                ConnectHub
              </h1>

              <p>
                {authMode ===
                "login"
                  ? "Welcome back 👋"
                  : "Create your ConnectHub account"}
              </p>
            </div>

            {authMode ===
            "login" ? (
              <form
                onSubmit={
                  handleLogin
                }
              >
                <input
                  style={
                    inputStyle
                  }
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  required
                />

                <input
                  style={
                    inputStyle
                  }
                  type="password"
                  placeholder="Password"
                  value={
                    password
                  }
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <button
                  style={
                    primaryButtonStyle
                  }
                  type="submit"
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Logging in..."
                    : "Login"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={
                  handleRegister
                }
              >
                <input
                  style={
                    inputStyle
                  }
                  placeholder="Full Name"
                  value={
                    registerName
                  }
                  onChange={(e) =>
                    setRegisterName(
                      e.target.value
                    )
                  }
                  required
                />

                <input
                  style={
                    inputStyle
                  }
                  placeholder="Username"
                  value={
                    registerUsername
                  }
                  onChange={(e) =>
                    setRegisterUsername(
                      e.target.value
                    )
                  }
                  required
                />

                <input
                  style={
                    inputStyle
                  }
                  type="email"
                  placeholder="Email"
                  value={
                    registerEmail
                  }
                  onChange={(e) =>
                    setRegisterEmail(
                      e.target.value
                    )
                  }
                  required
                />

                <input
                  style={
                    inputStyle
                  }
                  type="password"
                  placeholder="Password"
                  value={
                    registerPassword
                  }
                  onChange={(e) =>
                    setRegisterPassword(
                      e.target.value
                    )
                  }
                  required
                />

                <textarea
                  style={
                    inputStyle
                  }
                  placeholder="Bio"
                  value={
                    registerBio
                  }
                  onChange={(e) =>
                    setRegisterBio(
                      e.target.value
                    )
                  }
                />

                <button
                  style={
                    primaryButtonStyle
                  }
                  type="submit"
                  disabled={
                    loading
                  }
                >
                  {loading
                    ? "Creating..."
                    : "Create Account"}
                </button>
              </form>
            )}

            {message && (
              <p
                style={{
                  textAlign:
                    "center",
                  marginTop:
                    "15px",
                  fontWeight:
                    "600",
                }}
              >
                {message}
              </p>
            )}

            <div
              style={{
                textAlign:
                  "center",
                marginTop:
                  "20px",
              }}
            >
              {authMode ===
              "login" ? (
                <>
                  Don't have an
                  account?{" "}
                  <button
                    style={
                      linkButtonStyle
                    }
                    onClick={() => {
                      setAuthMode(
                        "register"
                      );
                      setMessage("");
                    }}
                  >
                    Register
                  </button>
                </>
              ) : (
                <>
                  Already have an
                  account?{" "}
                  <button
                    style={
                      linkButtonStyle
                    }
                    onClick={() => {
                      setAuthMode(
                        "login"
                      );
                      setMessage("");
                    }}
                  >
                    Login
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN CONNECTHUB
  // ==========================================

  return (
    <div className="app">

      {/* NAVBAR */}

      <header className="navbar">
        <div className="logo">
          <span className="logo-icon">
            C
          </span>

          <span>
            ConnectHub
          </span>
        </div>

        <div className="nav-links">
          <button
            className={
              activePage ===
              "home"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "home"
              )
            }
          >
            🏠 Home
          </button>

          <button
            className={
              activePage ===
              "people"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "people"
              )
            }
          >
            👥 People
          </button>

          <button
            className={
              activePage ===
              "profile"
                ? "active"
                : ""
            }
            onClick={() =>
              setActivePage(
                "profile"
              )
            }
          >
            👤 Profile
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: "12px",
          }}
        >
          <button
            className="profile-mini"
            onClick={() =>
              setActivePage(
                "profile"
              )
            }
          >
            <span className="avatar small">
              {currentUser.avatar ||
                "👤"}
            </span>

            <span>
              {currentUser.name}
            </span>
          </button>

          <button
            onClick={
              handleLogout
            }
            style={
              logoutButtonStyle
            }
          >
            Logout
          </button>
        </div>
      </header>

      {/* EDIT POST MODAL */}

      {editingPost && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.45)",
            display: "flex",
            justifyContent:
              "center",
            alignItems:
              "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "25px",
            }}
          >
            <h2>
              Edit Post ✏️
            </h2>

            <textarea
              value={editText}
              onChange={(e) =>
                setEditText(
                  e.target.value
                )
              }
              style={{
                width: "100%",
                minHeight:
                  "130px",
                padding:
                  "14px",
                borderRadius:
                  "10px",
                border:
                  "1px solid #d1d5db",
                resize:
                  "vertical",
                boxSizing:
                  "border-box",
                fontSize:
                  "15px",
                marginTop:
                  "15px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: "10px",
                marginTop:
                  "15px",
              }}
            >
              <button
                onClick={() => {
                  setEditingPost(
                    null
                  );
                  setEditText("");
                }}
                style={
                  cancelButtonStyle
                }
              >
                Cancel
              </button>

              <button
                onClick={
                  handleEditPost
                }
                style={
                  saveButtonStyle
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN */}

      <main className="main-container">

        {/* HOME */}

        {activePage ===
          "home" && (
          <div className="home-layout">

            {/* LEFT SIDEBAR */}

            <aside className="sidebar left-sidebar">
              <div className="profile-card">
                <div className="cover"></div>

                <div className="profile-card-content">

                  <div className="avatar large">
                    {currentUser.avatar ||
                      "👤"}
                  </div>

                  <h3>
                    {
                      currentUser.name
                    }
                  </h3>

                  <p>
                    @
                    {
                      currentUser.username
                    }
                  </p>

                  <div className="profile-stats">

                    <div>
                      <strong>
                        {currentUser
                          .followers
                          ?.length ||
                          0}
                      </strong>

                      <span>
                        Followers
                      </span>
                    </div>

                    <div>
                      <strong>
                        {currentUser
                          .following
                          ?.length ||
                          0}
                      </strong>

                      <span>
                        Following
                      </span>
                    </div>

                  </div>

                  <button
                    className="view-profile-btn"
                    onClick={() =>
                      setActivePage(
                        "profile"
                      )
                    }
                  >
                    View Profile
                  </button>

                </div>
              </div>
            </aside>

            {/* FEED */}

            <section className="feed">

              {/* CREATE POST */}

              <div className="create-post card">

                <div className="create-post-top">

                  <div className="avatar">
                    {currentUser.avatar ||
                      "👤"}
                  </div>

                  <textarea
                    value={newPost}
                    onChange={(e) =>
                      setNewPost(
                        e.target.value
                      )
                    }
                    placeholder="What's on your mind?"
                  />

                </div>

                <div className="create-post-bottom">

                  <span>
                    📝 Share your
                    thoughts
                  </span>

                  <button
                    className="post-btn"
                    onClick={
                      handleCreatePost
                    }
                  >
                    Post
                  </button>

                </div>

              </div>

              {/* EMPTY POSTS */}

              {posts.length ===
                0 && (
                <div
                  className="card"
                  style={{
                    padding:
                      "30px",
                    textAlign:
                      "center",
                  }}
                >
                  <h3>
                    No posts yet
                  </h3>

                  <p>
                    Be the first to
                    create a post!
                    🚀
                  </p>
                </div>
              )}

              {/* POSTS */}

              {posts.map(
                (post) => {

                  const postUser =
                    post.user;

                  const isLiked =
                    post.likes?.some(
                      (id) =>
                        id.toString() ===
                        currentUser._id.toString()
                    );

                  const isMyPost =
                    postUser?._id?.toString() ===
                    currentUser._id.toString();

                  return (
                    <article
                      className="post-card card"
                      key={
                        post._id
                      }
                    >

                      {/* POST HEADER */}

                      <div className="post-header">

                        <div className="avatar">
                          {postUser?.avatar ||
                            "👤"}
                        </div>

                        <div className="post-user">

                          <h3>
                            {
                              postUser?.name
                            }
                          </h3>

                          <span>
                            @
                            {
                              postUser?.username
                            }{" "}
                            •{" "}
                            {new Date(
                              post.createdAt
                            ).toLocaleString()}
                          </span>

                        </div>

                        {/* POST MENU */}

                        <div
                          style={{
                            position:
                              "relative",
                            marginLeft:
                              "auto",
                          }}
                        >

                          <button
                            className="more-btn"
                            onClick={() =>
                              setOpenMenu(
                                openMenu ===
                                  post._id
                                  ? null
                                  : post._id
                              )
                            }
                          >
                            •••
                          </button>

                          {openMenu ===
                            post._id && (
                            <div
                              style={{
                                position:
                                  "absolute",
                                right: 0,
                                top: "38px",
                                background:
                                  "#ffffff",
                                border:
                                  "1px solid #e5e7eb",
                                borderRadius:
                                  "12px",
                                boxShadow:
                                  "0 10px 30px rgba(0,0,0,0.12)",
                                padding:
                                  "6px",
                                minWidth:
                                  "160px",
                                zIndex: 100,
                              }}
                            >

                              {isMyPost ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingPost(
                                        post
                                      );

                                      setEditText(
                                        post.text
                                      );

                                      setOpenMenu(
                                        null
                                      );
                                    }}
                                    style={
                                      menuButtonStyle
                                    }
                                  >
                                    ✏️ Edit Post
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleDeletePost(
                                        post._id
                                      )
                                    }
                                    style={{
                                      ...menuButtonStyle,
                                      color:
                                        "#dc2626",
                                    }}
                                  >
                                    🗑️ Delete Post
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={
                                    handleReportPost
                                  }
                                  style={
                                    menuButtonStyle
                                  }
                                >
                                  🚩 Report Post
                                </button>
                              )}

                            </div>
                          )}

                        </div>

                      </div>

                      {/* POST CONTENT */}

                      <div className="post-content">
                        <p>
                          {
                            post.text
                          }
                        </p>
                      </div>

                      {/* POST ACTIONS */}

                      <div className="post-actions">

                        <button
                          className={
                            isLiked
                              ? "liked"
                              : ""
                          }
                          onClick={() =>
                            handleLike(
                              post._id
                            )
                          }
                        >
                          {isLiked
                            ? "❤️"
                            : "🤍"}{" "}
                          {
                            post.likes
                              ?.length ||
                            0
                          }
                        </button>

                        <button>
                          💬{" "}
                          {
                            post.comments
                              ?.length ||
                            0
                          }
                        </button>

                        <button
                          onClick={() =>
                            navigator.clipboard
                              ?.writeText(
                                post.text
                              )
                              .then(
                                () =>
                                  alert(
                                    "Post text copied! 📋"
                                  )
                              )
                          }
                        >
                          ↗️ Share
                        </button>

                      </div>

                      {/* COMMENTS */}

                      <div className="comments">

                        {post.comments?.map(
                          (
                            comment,
                            index
                          ) => {

                            const isMyComment =
                              comment.user?._id?.toString() ===
                              currentUser._id.toString();

                            const commentMenuId =
                              `${post._id}-${comment._id}`;

                            return (
                              <div
                                className="comment"
                                key={
                                  comment._id ||
                                  index
                                }
                                style={{
                                  position:
                                    "relative",
                                }}
                              >

                                <div className="avatar tiny">
                                  {comment
                                    .user
                                    ?.avatar ||
                                    "👤"}
                                </div>

                                <div
                                  className="comment-body"
                                  style={{
                                    flex:
                                      1,
                                  }}
                                >

                                  <strong>
                                    {
                                      comment
                                        .user
                                        ?.name
                                    }
                                  </strong>

                                  <p>
                                    {
                                      comment.text
                                    }
                                  </p>

                                </div>

                                {/* COMMENT MENU */}

                                {isMyComment && (
                                  <div
                                    style={{
                                      position:
                                        "relative",
                                      marginLeft:
                                        "auto",
                                    }}
                                  >

                                    <button
                                      className="more-btn"
                                      onClick={() =>
                                        setOpenCommentMenu(
                                          openCommentMenu ===
                                            commentMenuId
                                            ? null
                                            : commentMenuId
                                        )
                                      }
                                    >
                                      •••
                                    </button>

                                    {openCommentMenu ===
                                      commentMenuId && (
                                      <div
                                        style={{
                                          position:
                                            "absolute",
                                          right: 0,
                                          top: "32px",
                                          background:
                                            "#ffffff",
                                          border:
                                            "1px solid #e5e7eb",
                                          borderRadius:
                                            "10px",
                                          boxShadow:
                                            "0 8px 25px rgba(0,0,0,0.12)",
                                          padding:
                                            "6px",
                                          minWidth:
                                            "150px",
                                          zIndex: 200,
                                        }}
                                      >

                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              post._id,
                                              comment._id
                                            )
                                          }
                                          style={{
                                            ...menuButtonStyle,
                                            color:
                                              "#dc2626",
                                          }}
                                        >
                                          🗑️ Delete Comment
                                        </button>

                                      </div>
                                    )}

                                  </div>
                                )}

                              </div>
                            );
                          }
                        )}

                        {/* COMMENT INPUT */}

                        <div className="comment-input">

                          <div className="avatar tiny">
                            {currentUser.avatar ||
                              "👤"}
                          </div>

                          <input
                            type="text"
                            placeholder="Write a comment..."
                            value={
                              commentText[
                                post._id
                              ] ||
                              ""
                            }
                            onChange={(e) =>
                              setCommentText(
                                {
                                  ...commentText,
                                  [post._id]:
                                    e.target
                                      .value,
                                }
                              )
                            }
                            onKeyDown={(
                              e
                            ) => {
                              if (
                                e.key ===
                                "Enter"
                              ) {
                                handleComment(
                                  post._id
                                );
                              }
                            }}
                          />

                          <button
                            onClick={() =>
                              handleComment(
                                post._id
                              )
                            }
                          >
                            Send
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </section>

            {/* RIGHT SIDEBAR */}

            <aside className="sidebar right-sidebar">

              <div className="card people-card">

                <div className="section-title">
                  <h3>
                    People You May Know
                  </h3>
                </div>

                {users
                  .filter(
                    (user) =>
                      user._id !==
                      currentUser._id
                  )
                  .map((user) => {

                    const isFollowing =
                      currentUser.following?.some(
                        (id) =>
                          id.toString() ===
                          user._id.toString()
                      );

                    return (
                      <div
                        className="person"
                        key={
                          user._id
                        }
                      >

                        <div className="avatar">
                          {user.avatar ||
                            "👤"}
                        </div>

                        <div className="person-info">

                          <strong>
                            {
                              user.name
                            }
                          </strong>

                          <span>
                            @
                            {
                              user.username
                            }
                          </span>

                        </div>

                        <button
                          className={
                            isFollowing
                              ? "following-btn"
                              : "follow-btn"
                          }
                          onClick={() =>
                            handleFollow(
                              user._id
                            )
                          }
                        >
                          {isFollowing
                            ? "Following"
                            : "Follow"}
                        </button>

                      </div>
                    );
                  })}

              </div>

              <div className="card about-card">

                <h3>
                  About ConnectHub
                </h3>

                <p>
                  ConnectHub is a
                  mini social media
                  platform built for
                  the CodeAlpha Full
                  Stack Development
                  Internship.
                </p>

                <div className="tech-tags">

                  <span>
                    React
                  </span>

                  <span>
                    Express
                  </span>

                  <span>
                    MongoDB
                  </span>

                </div>

              </div>

            </aside>

          </div>
        )}

        {/* PEOPLE PAGE */}

        {activePage ===
          "people" && (
          <section className="people-page">

            <div className="page-heading">

              <h1>
                Discover People
              </h1>

              <p>
                Connect with other
                users on ConnectHub.
              </p>

            </div>

            <div className="people-grid">

              {users.map(
                (user) => {

                  const isFollowing =
                    currentUser.following?.some(
                      (id) =>
                        id.toString() ===
                        user._id.toString()
                    );

                  return (
                    <div
                      className="user-card card"
                      key={
                        user._id
                      }
                    >

                      <div className="user-card-cover"></div>

                      <div className="user-card-content">

                        <div className="avatar extra-large">
                          {user.avatar ||
                            "👤"}
                        </div>

                        <h2>
                          {user.name}
                        </h2>

                        <span>
                          @
                          {
                            user.username
                          }
                        </span>

                        <p>
                          {user.bio ||
                            "ConnectHub user"}
                        </p>

                        <div className="user-card-stats">

                          <span>
                            <strong>
                              {user
                                .followers
                                ?.length ||
                                0}
                            </strong>{" "}
                            Followers
                          </span>

                          <span>
                            <strong>
                              {user
                                .following
                                ?.length ||
                                0}
                            </strong>{" "}
                            Following
                          </span>

                        </div>

                        {user._id !==
                          currentUser._id && (
                          <button
                            className={
                              isFollowing
                                ? "following-btn full"
                                : "follow-btn full"
                            }
                            onClick={() =>
                              handleFollow(
                                user._id
                              )
                            }
                          >
                            {isFollowing
                              ? "✓ Following"
                              : "+ Follow"}
                          </button>
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </section>
        )}

        {/* PROFILE PAGE */}

        {activePage ===
          "profile" && (
          <section className="profile-page">

            <div className="profile-banner">

              <div className="profile-banner-content">

                <div className="avatar profile-avatar">
                  {currentUser.avatar ||
                    "👤"}
                </div>

                <div>

                  <h1>
                    {
                      currentUser.name
                    }
                  </h1>

                  <p>
                    @
                    {
                      currentUser.username
                    }
                  </p>

                </div>

              </div>

            </div>

            <div className="profile-details card">

              <h2>
                About Me
              </h2>

              <p>
                {currentUser.bio ||
                  "Welcome to my ConnectHub profile."}
              </p>

              <div className="profile-detail-grid">

                <div>

                  <strong>
                    {currentUser
                      .followers
                      ?.length ||
                      0}
                  </strong>

                  <span>
                    Followers
                  </span>

                </div>

                <div>

                  <strong>
                    {currentUser
                      .following
                      ?.length ||
                      0}
                  </strong>

                  <span>
                    Following
                  </span>

                </div>

                <div>

                  <strong>
                    {
                      posts.filter(
                        (post) =>
                          post.user?._id ===
                          currentUser._id
                      ).length
                    }
                  </strong>

                  <span>
                    Posts
                  </span>

                </div>

              </div>

              <button
                className="back-btn"
                onClick={() =>
                  setActivePage(
                    "home"
                  )
                }
              >
                ← Back to Feed
              </button>

            </div>

          </section>
        )}

      </main>

      {/* FOOTER */}

      <footer className="footer">

        <strong>
          ConnectHub
        </strong>

        <span>
          Mini Social Media
          Platform
        </span>

        <span>
          Built for CodeAlpha
          Task 2
        </span>

      </footer>

    </div>
  );
}

// ==========================================
// INLINE STYLES
// ==========================================

const inputStyle = {
  width: "100%",
  padding: "13px",
  marginBottom: "12px",
  borderRadius: "10px",
  border:
    "1px solid #d1d5db",
  fontSize: "15px",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  width: "100%",
  padding: "13px",
  borderRadius: "10px",
  border: "none",
  cursor: "pointer",
  fontWeight: "700",
  fontSize: "15px",
  background: "#111827",
  color: "white",
};

const linkButtonStyle = {
  border: "none",
  background:
    "transparent",
  cursor: "pointer",
  fontWeight: "700",
};

const logoutButtonStyle = {
  border: "none",
  background:
    "transparent",
  cursor: "pointer",
  fontWeight: "600",
};

const menuButtonStyle = {
  width: "100%",
  display: "block",
  textAlign: "left",
  padding: "10px 12px",
  border: "none",
  background:
    "transparent",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

const cancelButtonStyle = {
  padding: "10px 18px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: "600",
};

const saveButtonStyle = {
  padding: "10px 18px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  background: "#4f46e5",
  color: "white",
  fontWeight: "600",
};

export default App;