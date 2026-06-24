import { Router } from "express";
import {
    sendMessage,
    getConversations,
    getConversationById,
    deleteConversation
} from "../controllers/chat.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getOptionalUser } from "../middlewares/optionalAuth.middleware.js";


const router=Router();



router.route("/:conversationId/message").post(getOptionalUser,sendMessage)
router.use(verifyJWT)
router.route("/").get(getConversations)
router.route("/:conversationId").get(getConversationById).delete(deleteConversation)