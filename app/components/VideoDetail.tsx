import React from "react";

// Define the props type
interface VideoDetailProps {
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string | undefined;
}

// Functional component with props type
const VideoDetail: React.FC<VideoDetailProps> = ({
  title,
  channelTitle,
  thumbnail,
  publishedAt,
}) => {
  if (!title || !channelTitle || !thumbnail || !publishedAt) {
    return <p>No video details available.</p>;
  }

  return (
    <div>
      <h3>Title: {title}</h3>
      <p>Channel : {channelTitle}</p>
      <img src={thumbnail} alt={title} />
      <p>Published on: {publishedAt}</p>
    </div>
  );
};

export default VideoDetail;
