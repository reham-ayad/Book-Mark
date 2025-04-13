const mongoose = require('mongoose');
const schema=mongoose.Schema
const articleschema=new schema({
    LinkURL:String,
    Description:String,
    Password:String,

})
const Data=mongoose.model("Data",articleschema)



module.exports=Data 
