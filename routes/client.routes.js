import express from "express";
import { clientLetter, clientPreview } from "../controllers/client.controller.js";
const router = express.Router()

router.post("/", clientLetter);


router.post('/preview', clientPreview);






export default router;