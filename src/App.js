import "./App.css";
import { useState } from "react";
import React from "react";
import Post from "./Post";
import dataSource from "./dataSource";

export default function App() {
  const postSummaries = [
    {
      id: 0,
      title: "Relay without the Relay",
    },
    {
      id: 1,
      title: "Apollo without the Apollo",
    },
    {
      id: 2,
      title: "Suspense without... the Suspense",
    },
  ];

  const [postData, setPostData] = useState();
  const [loading, setLoading] = useState();

  return (
    <div className="App">
      <button
        onClick={() => {
          setPostData(null);
          dataSource.clearCaches();
          setLoading(null);
        }}
      >
        Reset
      </button>
      <ul>
        {postSummaries.map((p) => (
          <li
            key={p.id}
            onClick={async () => {
              // only flash a loading screen if loading takes > 25ms
              setTimeout(() => {
                setLoading(p.id);
              }, 25);
              setLoading(null);
              setPostData(await Post.fetch(p.id));
            }}
          >
            <a href="#!">{p.title}</a>
          </li>
        ))}
      </ul>
      {loading != null && postData?.post?.id != loading ? (
        <div>Loading...</div>
      ) : (
        <Post data={postData} />
      )}
    </div>
  );
}
