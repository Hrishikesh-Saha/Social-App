import { useQuery } from "@tanstack/react-query";

import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useEffect } from "react";

const Posts = ({ feedType }) => {
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/post/all";
      case "following":
        return "/api/post/following";
      default:
        return "/api/post/all";
    }
  };

  const postEndPoint = getPostEndpoint();

  const { isLoading, data: POSTS, isRefetching, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        
		const response = await fetch(postEndPoint);
        const data = response.json();

        if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
        }

		return data

      } catch (error) {
        throw error;
      }
    },
  });

  useEffect(() => {
	refetch()	
  }, [feedType, refetch])

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && POSTS?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && POSTS && (
        <div>
          {POSTS.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};
export default Posts;
