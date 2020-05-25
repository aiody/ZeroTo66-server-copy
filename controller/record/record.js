const { record } = require('../../models');
const { habits } = require('../../models');
const moment = require('moment');

// 미사용중
const get = (req, res) => {
  const { habitId } = req.body;
  const { id } = req.decoded;
  let today = moment().format('YYYY-MM-DD');
  record
    .findOne({
      where: {
        date: today,
        habitId: habitId,
      },
      include: [
        {
          model: habits,
          where: { userId: id },
        },
      ],
    })
    .then((data) => {
      if (data) {
        return res.status(200).json(data);
      } else {
        return res.status(403).send('there is no records');
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
};

const post = (req, res) => {
  const { habitId, completed } = req.body;
  let today = moment().format('YYYY-MM-DD');
  record
    .update(
      { completed: completed },
      {
        where: {
          date: today,
          habitId: habitId,
        },
      }
    )
    .then(() => {
      res.status(200).send('succeed update habit info');
    });
};

const getRecordToday = (req, res) => {
  const { id } = req.decoded;
  let today = moment().format('YYYY-MM-DD');
  record
    .findAll({
      where: {
        date: today,
      },
      include: [
        {
          model: habits,
          where: { userId: id },
        },
      ],
    })
    .then((data) => {
      if (data && data.length > 0) {
        return res.status(200).json(data);
      } else {
        return res.status(403).send('there is no records');
      }
    })
    .catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });
};

const addRecord = (
  habitId,
  completed = false,
  date = moment().format('YYYY-MM-DD')
) => {
  return new Promise((resolve, reject) => {
    record
      .create({
        date: date,
        completed: completed,
        habitId: habitId,
      })
      .then(async (record) => {
        const data = await record.get({ plain: true });
        resolve(data);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const syncRecord = (userId) => {
  habits.findAll({ where: { userId: userId } }).then((data) => {
    if (data && data.length > 0) {
      const today = moment().format('YYYY-MM-DD');
      data.forEach((ele) => {
        record.max('date', { where: { habitId: ele.id } }).then(async (max) => {
          if (max !== today) {
            let diff = moment(today).diff(max, 'days');
            for (let i = 1; i <= diff; i++) {
              await addRecord(
                ele.id,
                false,
                moment(max).add(i, 'days').format('YYYY-MM-DD')
              );
            }
          }
        });
      });
    }
  });
};

const getStreakInfo = (req, res) => {
  let habitId = req.url.replace('/', '');
  record
    .findAll({
      where: { habitId: habitId, completed: true },
      order: [['date', 'DESC']],
    })
    .then(async (data) => {
      if (data && data.length > 0) {
        let total = data.length;
        let longestStreak = getLongestStreak(data);
        let streak = getStreak(data);
        res
          .status(200)
          .send({ total: total, longestStreak: longestStreak, streak: streak });
      } else {
        res.status(403).send('there is no complete record of it');
      }
    });
};

function getLongestStreak(data) {
  let longest = 0;
  let standard = data[0];
  let standardDiff = 0;
  for (let i = 0; i < data.length; i++) {
    let diff = moment(standard.date).diff(data[i].date, 'days');
    if (diff === standardDiff) {
      standardDiff++;
    } else {
      longest = Math.max(longest, standardDiff);
      standard = data[i];
      standardDiff = 1;
    }
  }
  longest = Math.max(longest, standardDiff);
  return longest;
}

function getStreak(data) {
  const today = moment().format('YYYY-MM-DD');
  if (data[0].date !== today) return 0;
  let count = 1;
  for (let i = 0; i < data.length; i++) {
    if (data[i + 1]) {
      let diff = moment(data[i].date).diff(data[i + 1].date, 'days');
      if (diff !== 1) break;
      count++;
    }
  }
  return count;
}

module.exports = {
  get: get,
  post: post,
  getRecordToday: getRecordToday,
  addRecord: addRecord,
  syncRecord: syncRecord,
  getStreakInfo: getStreakInfo,
};