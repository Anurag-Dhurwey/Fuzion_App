import { Router } from "express";
import { db,admin } from "../firebase.config";
import { preview_project } from "../controllers/preview_image";

const routes = Router();

routes.get("/preview-project-image/:id",preview_project);
routes.post("/login",async (req, res) => {
//   admin.auth().createUser({
//     email: "user@example.com",
//     password: "password123",
//   })
//   .then((user) => {
//    res.json(user)
//   })
//   .catch((error) => {
//     console.error("Error creating new user:", error);
//     res.status(404).json(error)
//   });
  
});





export { routes };
