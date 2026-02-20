import express from "express";
import { registerUser, verifyUser, login, getMe, logoutUser, forgotPassword, resetPassword } from "../controller/User.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", login);
router.get("/getMe", isLoggedIn, getMe);
router.get("/logout", isLoggedIn, logoutUser);
router.post("/forgotPassword", forgotPassword);
router.post("/resetPassword/:token", resetPassword);

export default router;

//$2b$10$2.P7YXzieMKkRD6/W8bfo.z02KTNbtyqExeof5d8NDtJXlFfyMt1S 1234
//$2b$10$P7faTJTSs/hdEvZjF/WTpeUGSNNJvByou6hnUzhjme7.L2vitLpB. 12345
//$2b$10$LeNIFGhgGUTiIrG7fU62t.cZjaknI1XVNdMfLbmUYl3prJgt3rwaW 1234