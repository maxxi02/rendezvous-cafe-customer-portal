import dns from "dns";
// Override ISP DNS — required for MongoDB Atlas SRV resolution
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

import { Db, MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
export const MONGODB: Db = client.db();
export default MONGODB;
