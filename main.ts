import {createConnection, createConnections, Connection} from "typeorm";
import { getManager, getRepository } from "typeorm";

import { Project } from './src/entity/Project'

(async () => {
  const connection: Connection = await createConnection();
  const u = await getRepository(Project).findOne(1);
  console.log(u)
})()
