# Numo - Quick Start Guide

Get up and running with Numo in 5 minutes!

## 🚀 Quick Setup

### Step 1: Install Dependencies (1 min)

```bash
cd numo-finance-app
npm install
```

### Step 2: Set Up Supabase (2 min)
still can't logout ive been clicking this 
1. **Create Project**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name and password
   - Wait for setup to complete

2. **Run Database Setup**
   - In your Supabase dashboard, go to SQL Editor
   - Copy the entire contents of `supabase-setup.sql`
   - Paste and run it
   - ✅ Tables, policies, and indexes are now created!

3. **Get Your Credentials**
   - Go to Project Settings > API
   - Copy your `Project URL`
   - Copy your `anon` `public` key

### Step 3: Configure App (1 min)

Create a `.env` in the project root (or use `app.config.js` with `extra` and `SUPABASE_URL` / `SUPABASE_ANON_KEY`):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing env.

### Step 4: Run the App (1 min)

```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

## 📱 First Time User Flow

### 1. Create Account
- Open the app
- Tap "Sign Up"
- Enter email: `test@example.com`
- Enter password: `password123`
- Tap "Create Account"

### 2. Create Your First Category
- Navigate to "Categories" tab
- Tap the "+" button
- Name: "Food"
- Pick a color (e.g., red)
- Pick an icon (e.g., 🍔)
- Tap "Create"

### 3. Add Your First Transaction
- Go to "Dashboard" tab
- Tap the green "+" button (bottom right)
- Select "Expense"
- Amount: `25.50`
- Category: "Food"
- Note: "Lunch at restaurant"
- Tap "Add Transaction"

### 4. View Your Data
- Dashboard shows your balance, charts, and recent transactions
- Transactions tab shows all your entries
- Swipe left to delete a transaction
- Tap a transaction to edit it

### 5. Enable Dark Mode
- Go to "Profile" tab
- Toggle "Dark Mode"
- The app theme changes instantly!

## 🎯 Common Use Cases

### Adding Income
1. Tap "+" button
2. Select "Income"
3. Create a "Salary" category if needed
4. Enter amount and save

### Categorizing Spending
1. Create categories for: Food, Transport, Bills, Shopping, etc.
2. Assign each transaction to a category
3. View expense breakdown in pie chart

### Tracking Monthly Trends
- The line chart shows last 6 months
- Green line = Income
- Red line = Expenses
- Pull down to refresh data

### Managing Categories
- Edit: Tap the edit icon on any category
- Delete: Tap the trash icon
- Note: Deleting a category doesn't delete transactions

## 🐛 Troubleshooting

**App won't start?**
```bash
expo start -c  # Clear cache
```

**Login / Sign up not working?**
- Use a `.env` with `SUPABASE_URL` and `SUPABASE_ANON_KEY` (restart after editing)
- Supabase dashboard > Authentication: turn off "Confirm email" for quick dev testing
- Ensure you ran the full `supabase-setup.sql` in SQL Editor (tables + RLS + trigger)

**RLS policy errors in Supabase?**
- The setup script is idempotent: run the whole `supabase-setup.sql` again in SQL Editor. It drops existing policies then recreates them, so you won’t get "policy already exists" or conflicting RLS.
- Profile creation is done by a database trigger on sign-up; the app no longer inserts into `profiles` from the client.

**Charts not showing?**
- Add at least one transaction
- Pull down to refresh the dashboard

**Can't see my data?**
- Check that you're logged in
- Verify database policies are created correctly

## 📚 Key Features Overview

| Feature | Location | Description |
|---------|----------|-------------|
| Balance Overview | Dashboard | Total balance, income, expenses |
| Pie Chart | Dashboard | Expenses by category |
| Line Chart | Dashboard | 6-month trend |
| Add Transaction | + Button | Quick entry form |
| Filter Transactions | Transactions tab | All/Income/Expense |
| Swipe to Delete | Transactions list | Swipe left |
| Categories | Categories tab | Manage custom categories |
| Dark Mode | Profile tab | Toggle theme |
| Logout | Profile tab | Sign out |

## 🎨 Customization Tips

### Creating Good Categories
- **Keep it simple**: 5-10 categories is ideal
- **Use colors wisely**: Different colors for different types
- **Pick relevant icons**: Makes scanning easier

### Organizing Transactions
- **Be consistent**: Use the same categories
- **Add notes**: Future you will thank you
- **Regular entry**: Add transactions daily

## 💡 Pro Tips

1. **Batch Entry**: Add multiple transactions in one session
2. **Review Weekly**: Check your dashboard every Sunday
3. **Category Colors**: Use warm colors (red/orange) for variable expenses, cool colors (blue/green) for fixed
4. **Notes**: Add merchant names or details for better tracking
5. **Date Accuracy**: Always set the correct transaction date

## 🔐 Security Notes

- ✅ All data is stored securely in Supabase
- ✅ Row-level security protects your data
- ✅ Only you can see your transactions
- ✅ Passwords are hashed and secure
- ✅ Sessions auto-refresh

## 🆘 Need Help?

- **Documentation**: See README.md for full docs
- **Database Schema**: Check supabase-setup.sql
- **Issues**: Open an issue on GitHub
- **Email**: support@numo.app

## 🎉 You're Ready!

Start tracking your finances with Numo. Happy budgeting! 💰✨

---

**Next Steps:**
1. Add more categories
2. Import past transactions
3. Set up recurring entries (future feature)
4. Explore charts and insights