import { Router } from "express";
import { db,admin } from "../firebase.config";

const routes = Router();

routes.post("/test",async (req, res) => {
  const data = {
    name: "John Doe",
    age: 30,
    city: "New York"
  };
  
  db.collection('users').add(data)
    .then(ref => {
      console.log('Document written with ID:', ref.id);

    })
    .catch(err => {
      // res.json({message:'error'})
      console.error('Error adding document:', err);
    });
  res.json({message:'done'})
  
});
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
