import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const url = "https://www.youtube.com/watch?v=r8Dg0KVnfMA";
const formattedUrl = new URL(url);
const VIDEO_ID = formattedUrl.searchParams.get("v");

async function fetchDetails() {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${VIDEO_ID}&key=${API_KEY}`
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const fetchedData = await response.json();
  const video = fetchedData.items[0].snippet;
  const rawDate = new Date(video.publishedAt);
  const day = String(rawDate.getDate()).padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    rawDate
  ); // Full month name
  const year = rawDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  return {
    title: video.title,
    thumbnail: video.thumbnails.medium.url,
    publishedAt: formattedDate,
  };
}

export const Route = createFileRoute("/youtube/VideoDetails")({
  component: VideoDetails,
});
export function VideoDetails() {
  const router = useRouter();
  // Use the explicit type for the query result
  const { data, isLoading, error } = useQuery({
    queryKey: ["videoDetails"],
    queryFn: fetchDetails,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error instanceof Error) return <div>Error: {error.message}</div>;
  return (
    <div>
      <h3>Title : {data?.title}</h3>
      <img src={data?.thumbnail} alt={data?.title} />
      <p>Published on: {data?.publishedAt}</p>
    </div>
  );
}
