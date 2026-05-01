import { useEffect, useState } from "react";
import { Sparkles, BookOpen, Users } from "lucide-react";
import Navbar from "@/Components/MainNavbar.jsx";
import About from "@/Pages/About.jsx";
import Inspirations from "@/Pages/Inspirations.jsx";
import Footer from "@/Components/Footer.jsx";
import AnimatedBackground from "@/Components/Background.jsx";
import { useTheme } from "../context/ThemeContect.jsx";
import { Link } from "react-router-dom";
import { api } from "../utils/api";
import ReplyBox from "../Components/ReplyBox"; // <-- forum replies

const Home = () => {
  const { theme } = useTheme();

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const res = await api.get("/posts");
      setPosts(res.data);
    } catch (err) {
      console.log("Error loading posts", err);
    }
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    try {
      await api.post("/posts", {
        title: "Post",
        content: newPost,
        author: "Anonymous"
      });
      setNewPost("");
      await loadPosts();
    } catch (err) {
      console.error("Erreur création post:", err);
    }
  };

  const handleExplore = () => {
    window.location.href = "/Courses";
  };

  const handleAuth = () => {
    window.location.href = "/auth";
  };

  const handleInspiration = () => {
    window.location.href = "#Inspiration";
  };

  return (
    <div
      id="hikma-learn"
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        backgroundColor: theme === "dark" ? "#030014" : "#f8fafc",
        transition: "background-color 0.5s ease",
      }}
    >
      <AnimatedBackground />
      <Navbar />

      {/* HERO SECTION */}
      <div className="text-center z-10 relative max-w-5xl mx-auto px-[5%] py-20">
        <div className="inline-block relative group mb-6">
          <img
            className="inline-block"
            src="src/assets/media/Welcome to.png"
            alt="Welcome"
          />
          <img
            className="inline-block"
            src="src/assets/media/side logo.png"
            alt="Logo"
          />
        </div>

        <p
          className={`mt-6 text-xl flex items-center justify-center gap-2 mb-10 ${
            theme === "dark" ? "text-gray-100" : "text-gray-800"
          }`}
        >
          <Sparkles className="text-red-400" />
          Where limitations become launchpads for greatness
          <Sparkles className="text-red-400" />
        </p>

        <p
          className={`max-w-4xl mx-auto mb-10 ${
            theme === "dark" ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Hikma Learn is a platform that empowers learners through inclusive education.
        </p>

        {/* BUTTONS */}
        <div className="flex flex-col lg:flex-row gap-4 justify-center">
          <button
            onClick={handleExplore}
            className="px-8 py-4 bg-red-600 text-white rounded-lg hover:scale-105 transition"
          >
            <BookOpen className="inline mr-2" />
            Explore Courses
          </button>

          <Link
            to="/create-post"
            className="px-8 py-4 bg-green-600 text-white rounded-lg hover:scale-105 transition text-center"
          >
            Create Post
          </Link>

          <button
            onClick={handleAuth}
            className="px-8 py-4 bg-gray-800 text-white rounded-lg hover:scale-105 transition"
          >
            <Users className="inline mr-2" />
            Sign In
          </button>
        </div>
      </div>

      {/* 🧠 FORUM SECTION */}
      <div className="w-full max-w-5xl mx-auto mt-10 z-10">
        <h2 className="text-2xl font-bold text-white mb-6">
          🧠 Latest Community Posts
        </h2>

        {/* Champ pour créer un post */}
        <div className="mb-6">
          <textarea
            className="w-full p-3 rounded-lg border border-gray-300 mb-2"
            placeholder="Écris ton post ici..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <button
            onClick={createPost}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:scale-105 transition"
          >
            Create Post
          </button>
        </div>

        {/* Liste des posts */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-gray-400">No posts yet...</p>
          )}

          {posts.map((post) => (
            <div
              key={post._id} // ⚠️ utilise _id avec Mongoose
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5 hover:scale-[1.01] transition"
            >
              <h3 className="text-lg font-bold text-white">{post.title}</h3>
              <p className="text-gray-300 mt-2">{post.content}</p>

              {/* Affichage des réponses */}
              {post.comments && post.comments.length > 0 && (
                <div className="mt-3 pl-4 border-l border-gray-500">
                  <h4 className="text-sm text-gray-200 mb-2">💬 Réponses :</h4>
                  {post.comments.map((c, idx) => (
                    <div key={idx} className="text-gray-300 text-sm mb-1">
                      <strong>{c.author}:</strong> {c.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Champ pour ajouter une réponse */}
              <ReplyBox postId={post._id} />
            </div>
          ))}
        </div>
      </div>

      {/* EXTRA SECTIONS */}
      <About />
      <Inspirations />
      <Footer />
    </div>
  );
};

export default Home;
