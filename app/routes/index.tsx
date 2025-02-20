import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { Link } from "@tanstack/react-router";

const filePath = "count.txt";
//read count.txt
async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0")
  );
}

//get data from count.txt
const getCount = createServerFn({ method: "GET" }).handler(() => {
  return readCount();
});

//edit data inside count.txt
const addCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

const subCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count - data}`);
  });

// Routing
export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          addCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
      >
        Add 1 to {state}?
      </button>

      <button
        type="button"
        onClick={() => {
          subCount({ data: 1 }).then(() => {
            router.invalidate();
          });
        }}
      >
        Subtract 1 to {state}?
      </button>

      <br />
      <br />

      <button>
        <Link to="/youtube"> To youtube thingy page </Link>
      </button>
    </>
  );
}
