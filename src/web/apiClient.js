import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:4000",
  headers: { "x-api-key": process.env.API_KEY },
});

export default apiClient;
