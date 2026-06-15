const User = require('../models/User');

exports.getMyStreak = async (req, res) => {
  try {
    const user = await User.findById(req.query.userId).select('ultraStreak name profilePicture role');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if streak was broken (e.g. 48 hours passed)
    const now = new Date();
    if (user.ultraStreak && user.ultraStreak.lastActiveTimestamp) {
      const hoursSinceLastActive = (now - user.ultraStreak.lastActiveTimestamp) / (1000 * 60 * 60);
      if (hoursSinceLastActive > 48) {
        user.ultraStreak.currentStreak = 0;
        await user.save();
      }
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.continueStreak = async (req, res) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.ultraStreak) {
      user.ultraStreak = {
        currentStreak: 0,
        longestStreak: 0,
        xp: 0,
        leaderboardPoints: 0,
        streakHistory: [],
        rewardHistory: [],
        badgeInventory: [],
        streakMilestoneProgress: 0
      };
    }

    const now = new Date();
    let isNewDay = false;
    let earnedXp = 0;
    let newBadges = [];

    if (user.ultraStreak.lastActiveTimestamp) {
      const hoursSinceLastActive = (now - user.ultraStreak.lastActiveTimestamp) / (1000 * 60 * 60);
      
      if (hoursSinceLastActive > 48) {
        // Streak broken
        user.ultraStreak.currentStreak = 1;
        isNewDay = true;
      } else if (hoursSinceLastActive > 24 || new Date(user.ultraStreak.lastActiveTimestamp).getDate() !== now.getDate()) {
        // Next day continuation
        user.ultraStreak.currentStreak += 1;
        isNewDay = true;
      } else {
        // Already claimed today, but fix anomaly if it is 0
        if (user.ultraStreak.currentStreak === 0) {
          user.ultraStreak.currentStreak = 1;
          await user.save();
        }
        return res.status(200).json({ message: 'Streak already updated today', streak: user.ultraStreak });
      }
    } else {
      user.ultraStreak.currentStreak = 1;
      isNewDay = true;
    }

    if (isNewDay) {
      user.ultraStreak.lastActiveTimestamp = now;
      if (user.ultraStreak.currentStreak > user.ultraStreak.longestStreak) {
        user.ultraStreak.longestStreak = user.ultraStreak.currentStreak;
      }

      // Add to history
      user.ultraStreak.streakHistory.push({ date: now, action: 'STREAK_CONTINUED' });
      
      // Calculate XP and points
      earnedXp = 60;
      user.ultraStreak.xp += earnedXp;
      user.ultraStreak.leaderboardPoints += earnedXp;

      // Check milestones/badges
      const milestones = [7, 30, 100];
      for (const m of milestones) {
        if (user.ultraStreak.currentStreak === m) {
          const badgeName = m + ' Day Streak';
          if (!user.ultraStreak.badgeInventory.some(b => b.badgeName === badgeName)) {
            user.ultraStreak.badgeInventory.push({ badgeName, rarity: m >= 100 ? 'COSMIC' : m >= 30 ? 'GOLD' : 'SILVER' });
            newBadges.push(badgeName);
            
            user.ultraStreak.rewardHistory.push({ date: now, reward: badgeName + ' Badge', xpAmount: 500 });
            user.ultraStreak.xp += 500;
            user.ultraStreak.leaderboardPoints += 500;
          }
        }
      }

      await user.save();

      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.emit('leaderboard_update', { userId: user._id, points: user.ultraStreak.leaderboardPoints });
      }
    }

    res.json({
      message: 'Streak continued',
      streak: user.ultraStreak,
      earnedXp,
      newBadges
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' })
      .sort({ 'ultraStreak.leaderboardPoints': -1, 'ultraStreak.currentStreak': -1 })
      .limit(50)
      .select('name profilePicture role ultraStreak.leaderboardPoints ultraStreak.currentStreak ultraStreak.longestStreak ultraStreak.badgeInventory ultraStreak.streakHistory');
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
