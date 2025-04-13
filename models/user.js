module.exports = (connection) => {
    // استخدم mongoose.Schema بدلاً من connection.Schema
    const mongoose = require('mongoose');
  
    if (connection.models.User) {
      return connection.models.User; // عشان ميعملش كراش لو اتعرف قبل كده
    }
  
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String
    });
  
    return connection.model("User", userSchema);
  };
  