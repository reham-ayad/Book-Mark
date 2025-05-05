const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const Data = require("./models/mydata");

const app = express();
const port = 3000;
const session = require('express-session');

// اتصال المستخدم إلى قاعدة بيانات منفصلة
const userDB = mongoose.createConnection(
  'mongodb+srv://ayadreham40:fwphTVaBCh6ctksd@cluster0.imnrgsf.mongodb.net/mydb?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// في حالة الاتصال الناجح، تحميل موديل الـ User
let User;

userDB.on('connected', () => {
  console.log("✅ Connected to mydb");

  // حمل موديل المستخدم بعد الاتصال
  const createUserModel = require('./models/user');
  User = createUserModel(userDB);

  // يمكنك الآن تشغيل باقي السيرفر أو الراوتات
  // ابدأ تشغيل السيرفر بعد تحميل الموديل بنجاح

  app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}/`);
  });
});

// في حالة حدوث خطأ في الاتصال
userDB.on('error', (err) => {
  console.error("❌ Error connecting to db:", err);
});

// إعداد الجلسات بشكل صحيح
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

// إعدادات
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

// Live Reload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'public'));

app.use(connectLivereload());

liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");  
  }, 100);
});

// عرض صفحة التسجيل
app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/", (req, res) => {
  res.render("register");
});

// معالجة طلب التسجيل
app.post("/register", async (req, res) => {
  if (!User) return res.status(500).send("User model not ready");

  const { username, email, password } = req.body;

  // التحقق من وجود البريد الإلكتروني بالفعل
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("Email is already registered.");
  }

  // إنشاء مستخدم جديد
  const user = new User({ username, email, password });
  await user.save();

  res.redirect("/login");  // بعد التسجيل بنجاح، إعادة التوجيه إلى صفحة الدخول
});

// عرض صفحة الدخول
app.get("/login", (req, res) => {
  res.render("login");
});

// معالجة طلب الدخول
app.post("/login", async (req, res) => {
  if (!User) return res.status(500).send("User model not ready");

  const { email, password } = req.body;

  // البحث عن المستخدم
  const user = await User.findOne({ email });
  if (!user || user.password !== password) {
    return res.status(400).send("Invalid email or password.");
  }

  // حفظ ID المستخدم في الجلسة
  req.session.userId = user._id;
  res.redirect("/home");  // بعد النجاح في تسجيل الدخول، إعادة التوجيه إلى الصفحة الرئيسية
});

// Middleware لحماية المسارات
function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
}

// حماية الصفحة الرئيسية
app.get("/home", isAuthenticated, (req, res) => {
  res.render("home");
});

// عرض كل اللينكات
app.get("/Links", (req, res) => {
  Data.find()
    .then((result) => {
      res.render("Links", { arr: result });
    })
    .catch((err) => console.log(err));
});

// إضافة لينك جديد
app.post("/", (req, res) => {
Data.create(req.body)
    .then(() => res.redirect("/Links"))
    .catch((err) => console.log(err));
});

// update
app.put("/edit/:id", (req, res) => {
  Data.findByIdAndUpdate(req.params.id, req.body)
    .then(link => res.render("edit", { link }))
    .catch(err => {
      console.log(err);
      res.redirect("/Links");
    });
});

// delete
app.delete("/Links/:id", (req, res) => {
  Data.findByIdAndDelete(req.params.id)
    .then(() => res.redirect("/Links"))
    .catch(err => console.log(err));
});

// الاتصال بقاعدة بيانات all-data
mongoose.connect('mongodb+srv://ayadreham40:fwphTVaBCh6ctksd@cluster0.imnrgsf.mongodb.net/all-data?retryWrites=true&w=majority&appName=Cluster0')
  .catch(err => console.log(err));
