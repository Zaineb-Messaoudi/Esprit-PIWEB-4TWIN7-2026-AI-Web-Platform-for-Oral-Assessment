import React, { useState, useEffect } from "react";
import ReplyBox from "../Components/ReplyBox";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [author, setAuthor] = useState(""); // champ auteur

  useEffect(() => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => setPosts(data));
  }, []);

  const createPost = () => {
    if (!newPost.trim() || !author.trim()) return;

    fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Post",
        content: newPost,
        author: author
      })
    }).then(() => {
      setNewPost("");
      setAuthor("");
      // recharge la liste
      fetch("/api/posts")
        .then(res => res.json())
        .then(data => setPosts(data));
    });
  };

  return (
    <div className="container mt-4">
      <h2>Forum étudiant</h2>

      {/* Champ auteur */}
      <input
        className="form-control mb-2"
        value={author}
        onChange={e => setAuthor(e.target.value)}
        placeholder="Ton nom..."
      />

      {/* Champ contenu */}
      <textarea
        className="form-control mb-2"
        value={newPost}
        onChange={e => setNewPost(e.target.value)}
        placeholder="Écris ton post ici..."
      />

      <button className="btn btn-primary mb-4" onClick={createPost}>
        Create Post
      </button>

      {posts.map(p => (
        <div key={p._id} className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">{p.title}</h5>
            <p className="card-text">{p.content}</p>
            <p className="text-muted">👤 {p.author}</p> {/* affiche l’auteur */}
            <ReplyBox postId={p._id} />
          </div>
        </div>
      ))}
    </div>
  );
}
