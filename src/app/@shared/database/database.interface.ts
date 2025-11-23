import { Client } from "pg";

export interface IDatabaseConnection {
  connect(): Client;
  }