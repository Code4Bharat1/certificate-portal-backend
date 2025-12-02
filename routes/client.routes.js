import express from "express";
import mom from "../controllers/client.controller.js";
const router = express.Router()

router.post("/", mom);







export default router;