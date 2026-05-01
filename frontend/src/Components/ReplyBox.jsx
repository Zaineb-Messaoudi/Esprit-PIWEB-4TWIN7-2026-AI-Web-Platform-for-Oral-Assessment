import React, { useState } from "react";

function ReplyBox({ postId }) {
  const [reply, setReply] = useState("");

  const sendReply = async () => {
    try {
      await fetch(`http://localhost:3000/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: reply,
          author: "Anonymous" // ou récupère l’utilisateur connecté
        }),
      });
      setReply(""); // vide le champ après envoi
    } catch (err) {
      console.error("Erreur envoi réponse:", err);
    }
  };

  return (
    <div className="mt-2">
      <input
        className="form-control mb-2"
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Écris une réponse..."
      />
      <button className="btn btn-secondary" onClick={sendReply}>
        Reply
      </button>
    </div>
  );
}

export default ReplyBox;
