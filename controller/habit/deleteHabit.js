const { habits } = require('../../models');
const moment = require('moment');
module.exports = {
  patch: (req, res) => {
    const userId = req.decoded.id;
    const habitId = req.body.habitId;
    const today = moment().format('YYYY-MM-DD');
    habits
      .update(
        { deletedDate: today },
        { where: { id: habitId, userId: userId } }
      )
      .then(() => {
        res.status(201).send('update deletedDate');
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(500);
      });
  },
};
