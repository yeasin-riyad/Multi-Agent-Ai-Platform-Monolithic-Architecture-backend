// import { QdrantVectorStore } from "@langchain/qdrant";
// import { embeddings } from "./embeddings.js";
// import dotenv from "dotenv";
// dotenv.config();

// export const vectorStore= async (docs,collectionName)=>{
//     return await QdrantVectorStore.fromExistingCollection(docs,embeddings, {
//   url: process.env.QDRANT_URL,
//   collectionName,
// });
// }

import { QdrantVectorStore } from "@langchain/qdrant";
import { embeddings } from "./embeddings.js";
import dotenv from "dotenv";
dotenv.config();

export const vectorStore = async (docs, collectionName) => {
  // প্রথমে embeddings দিয়ে একটি QdrantVectorStore ইনস্ট্যান্স তৈরি করো
  const store = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName,
  });

  // তারপর docs যোগ করো (যদি docs খালি না থাকে)
  if (docs && docs.length > 0) {
    await store.addDocuments(docs);
  }

  return store;
};