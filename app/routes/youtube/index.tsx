import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import VideoDetail from "../../components/VideoDetail";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";

// Define the server function to fetch the API key
export const apiKey = createServerFn().handler(async () => {
  return import.meta.env.VITE_YOUTUBE_API_KEY;
});

export const Route = createFileRoute("/youtube/")({
  component: Youtube,
});

function Youtube() {
  const [inputURL, setInputURL] = useState("");
  const [currentURL, setCurrentURL] = useState(""); // State for the current URL used in the query

  async function fetchDetails() {
    if (!currentURL) {
      throw new Error("No URL provided");
    }

    const url = currentURL.trim();
    const formattedUrl = new URL(url);
    const videoId = formattedUrl.searchParams.get("v");

    if (!videoId) {
      throw new Error("Invalid YouTube URL or missing video ID");
    }

    // Fetch the API key from the server function
    const key = await apiKey();
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${key}`
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const fetchedData = await response.json();
    const video = fetchedData.items[0]?.snippet;

    const rawDate = new Date(video.publishedAt);
    const day = String(rawDate.getDate()).padStart(2, "0");
    const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
      rawDate
    );
    const year = rawDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    return {
      title: video.title,
      channelTitle: video.channelTitle,
      thumbnail: video.thumbnails.medium.url,
      publishedAt: formattedDate,
    };
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["videoDetails", currentURL],
    queryFn: fetchDetails,
    enabled: !!currentURL, // Trigger only if currentURL exists
  });

  const handleURL = () => {
    if (inputURL.trim() === "") {
      alert("Please enter a valid YouTube URL.");
      return;
    }
    setCurrentURL(inputURL.trim()); // Set current URL for the query
    setInputURL(""); // Clear the input field
    refetch(); // Trigger the query manually
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div>
        <input
          type="text"
          value={inputURL}
          onChange={(e) => setInputURL(e.target.value)}
          placeholder="Enter YouTube URL"
        />
        <button onClick={handleURL}>Submit</button>
      </div>

      {error instanceof Error && (
        <>
          <p>No video details available</p>
          <p>Reason: {error.message}</p>
        </>
      )}

      {data && (
        <VideoDetail
          title={data.title}
          channelTitle={data.channelTitle}
          thumbnail={data.thumbnail}
          publishedAt={data.publishedAt}
        />
      )}
    </>
  );
}
