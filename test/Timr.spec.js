import chai from 'chai';
import dirtyChai from 'dirty-chai';
import sinon from 'sinon';

import Timr from '../src/Timr';
import createStore from '../src/createStore';

// Turns methods like to.be.true into to.be.true() to stop eslint failing
chai.use(dirtyChai);

const { expect } = chai;

describe('Timr Class', () => {
  describe('Timr instantiation', () => {
    it('Creates a new Timr object', () => {
      expect(new Timr(600).startTime).to.equal(600);
      expect(new Timr(600).currentTime).to.equal(600);
      expect(new Timr(0).currentTime).to.equal(0);
    });

    it('Throws an error if startTime is not a string or a number', () => {
      expect(() => new Timr({})).to.throw(
        'Expected time to be a string or number, instead got: object'
      );
    });
  });

  describe('start method', () => {
    it('Starts the timer', done => {
      const timer = new Timr(600).start()
        .ticker(({ formattedTime }) => {
          expect(formattedTime).to.equal('09:59');
          timer.stop();
          done();
        });
    });

    it('Starts the timer after a delay', done => {
      const startTime = Date.now();
      const timer = new Timr(600).start(1000)
        .ticker(() => {
          expect(Date.now() - startTime >= 2000);
          timer.stop();
          done();
        });
    });

    it('If an ISO date has been used to start the timer, start will re-run setStartTime ' +
    'to ensure the startTime is in sync. Allowing .start() ' +
    'to be called at a later time.', done => {
      const year = new Date().getFullYear() + 1;

      const timer = new Timr(`${year}-12-15T10:00:00`)
        .ticker(({ currentTime }) => {
          const testStart = Math.ceil((Date.parse(`${year}-12-15T10:00:00`) - Date.now()) / 1000);

          expect(currentTime).to.equal(testStart);

          timer.destroy();
          done();
        });

      setTimeout(() => timer.start(), 2000);
    });

    it('Same test as above, but using starts delay feature', done => {
      const year = new Date().getFullYear() + 1;

      const timer = new Timr(`${year}-12-15T10:00:00`)
        .ticker(({ currentTime }) => {
          const testStart = Math.ceil((Date.parse(`${year}-12-15T10:00:00`) - Date.now()) / 1000);

          expect(currentTime).to.equal(testStart);

          timer.destroy();
          done();
        })
        .start(2000);
    });

    /* eslint-disable no-console */
    it('If a timer is running and the user tries to start it again, ' +
      'a warning in the console is logged', () => {
      sinon.stub(console, 'warn');

      new Timr(600)
        .start()
        .start()
        .destroy();

      expect(console.warn.calledWith('Timer already running')).to.be.true();
      console.warn.restore();
    });
    /* eslint-disable no-console */

    it('Emits the onStart event', (done) => {
      const timer = new Timr(600)
        .onStart(self => {
          expect(self).to.equal(timer);
          timer.destroy();
          done();
        });

      timer.start();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).start();
      expect(timer).equal(timer);
      timer.destroy();
    });
  });

  describe('pause method', () => {
    it('Pauses the timer', done => {
      const timer = new Timr(600).start()
        .ticker(() => {
          expect(timer.isRunning()).to.equal(true);
          timer.pause();
          expect(timer.isRunning()).to.equal(false);
          done();
        });
    });

    it('Emits the onPause event', (done) => {
      const timer = new Timr(600)
        .onPause(self => {
          expect(self).to.equal(timer);
          timer.destroy();
          done();
        });

      timer.start();
      timer.pause();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).pause();
      expect(timer).equal(timer);
    });
  });

  describe('stop method', () => {
    it('Stops the timer', done => {
      const timer = new Timr(600).start();
      timer.ticker(({ formattedTime }) => {
        expect(formattedTime).to.equal('09:59');
        timer.stop();
        expect(timer.getCurrentTime()).to.equal(600);
        done();
      });
    });

    it('Emits the onStop event', (done) => {
      const timer = new Timr(600)
        .onStop(self => {
          expect(self).to.equal(timer);
          timer.destroy();
          done();
        });

      timer.start();
      timer.stop();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).stop();
      expect(timer).equal(timer);
    });
  });

  describe('destroy method', () => {
    it('Clears the timer and removes all event listeners', () => {
      const timer = new Timr(600);
      timer.ticker(() => {});
      timer.ticker(() => {});
      timer.finish(() => {});

      expect(timer.events.ticker.length).to.equal(2);
      expect(timer.events.finish.length).to.equal(1);

      timer.destroy();

      expect(timer.events).to.be.empty();
    });

    it('Removes the timer from the store', () => {
      const timer = new Timr(600);
      const store = createStore(timer);

      expect(store.getAll().indexOf(timer)).to.equal(0);

      timer.destroy();

      expect(store.getAll().indexOf(timer)).to.equal(-1);
    });

    it('Emits the onDestroy event', (done) => {
      const timer = new Timr(600)
        .onDestroy(self => {
          expect(self).to.equal(timer);
          done();
        });

      timer.destroy();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).destroy();
      expect(timer).equal(timer);
    });
  });

  describe('ticker method', () => {
    it('Fires the ticker function every second the timer runs, ' +
      'returning the formattedTime, precentDone, currentTime, ' +
      'startTime and the original Timr object.', done => {
      const timer = new Timr(600).start()
        .ticker(({ formattedTime, percentDone, currentTime, startTime, self }) => {
          expect(formattedTime).to.equal('09:59');
          expect(percentDone).to.equal(0);
          expect(currentTime).to.equal(599);
          expect(startTime).to.equal(600);
          expect(self).to.equal(timer);
          timer.stop();
          done();
        });
    });

    it('As a stopwatch, fires the ticker function every second the timer runs, ' +
      'returning the formattedTime, startTime, currentTime and original Timr object.', done => {
      const timer = new Timr().start().ticker(
        ({ formattedTime, currentTime, startTime, self }) => {
          expect(formattedTime).to.equal('00:01');
          expect(currentTime).to.equal(1);
          expect(startTime).to.equal(0);
          expect(self).to.equal(timer);
          timer.stop();
          done();
        }
      );
    });

    it('The stopwatch is able to be started at any given time; previously in ' +
     'pre v1.0.0 a stopwatch could only be started at 0.', done => {
      const timer = new Timr(600, { countdown: false }).start().ticker(
        ({ formattedTime, currentTime, startTime, self }) => {
          expect(formattedTime).to.equal('10:01');
          expect(currentTime).to.equal(601);
          expect(startTime).to.equal(600);
          expect(self).to.equal(timer);
          timer.stop();
          done();
        }
      );
    });

    it('Throws an error if the ticker method is called with no ' +
      'function provided as the first argument', () => {
      expect(() => new Timr(600).ticker()).to.throw(
        'Expected ticker to be a function, instead got: undefined'
      );
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).ticker(() => {});
      expect(timer).equal(timer);
    });
  });

  describe('finish method', () => {
    it('Fires the finish function when the timer finishes ' +
      'and provides the original Timr object.', done => {
      const timer = new Timr(1).start();
      timer.finish(self => {
        expect(self).to.equal(timer);
        done();
      });
    });

    it('Throws an error if the finish method is called with no ' +
      'function provided as the first argument', () => {
      expect(() => new Timr(600).finish()).to.throw(
        'Expected finish to be a function, instead got: undefined'
      );
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).finish(() => {});
      expect(timer).equal(timer);
    });
  });

  describe('formatTime method', () => {
    it('Returns the currentTime formatted into a time string', () => {
      expect(new Timr(50).formatTime().formattedTime).to.equal('00:50');
      expect(new Timr(600).formatTime().formattedTime).to.equal('10:00');
      expect(new Timr(9600).formatTime().formattedTime).to.equal('02:40:00');
    });

    it('Returns the currentTime formatted into a time string with a modified formatOutput', () => {
      expect(new Timr(600, { formatOutput: 'MM-SS' }).formatTime().formattedTime)
        .to.equal('10-600');
      expect(new Timr(600, { formatOutput: 'boop' }).formatTime().formattedTime)
        .to.equal('boop');
    });

    it('Returns the startTime formatted into a time string', () => {
      expect(new Timr(50).formatTime('startTime').formattedTime).to.equal('00:50');
      expect(new Timr(600).formatTime('startTime').formattedTime).to.equal('10:00');
      expect(new Timr(9600).formatTime('startTime').formattedTime).to.equal('02:40:00');
    });

    it('Returns the startTime formatted into a time string with a modified formatOutput', () => {
      expect(new Timr(600, { formatOutput: '00:mm:ss' }).formatTime('startTime').formattedTime)
        .to.equal('00:10:00');
      expect(new Timr(50, { formatOutput: 'SS' }).formatTime('startTime').formattedTime)
        .to.equal('50');
    });
  });

  describe('percentDone method', () => {
    it('Returns the time elapsed in percent', () => {
      const timer = new Timr(600);
      expect(timer.percentDone()).to.equal(0);
      timer.currentTime = 400;
      expect(timer.percentDone()).to.equal(33);
    });
  });

  describe('changeOptions methods', () => {
    it('Changes the timrs options after creation.', () => {
      const timer = new Timr(600);
      expect(timer.formatTime().formattedTime).to.equal('10:00');
      timer.changeOptions({ formatOutput: '00-mm-ss' });
      expect(timer.formatTime().formattedTime).to.equal('00-10-00');
    });

    it('Changes the timrs options after creation and merges with existing ones.', () => {
      const timer = new Timr(600, { padRaw: false });
      expect(timer.formatTime().formattedTime).to.equal('10:00');
      expect(timer.formatTime().raw.currentMinutes).to.equal(10);
      timer.changeOptions({ padRaw: true, formatOutput: '00-mm-ss' });
      expect(timer.formatTime().formattedTime).to.equal('00-10-00');
      expect(timer.formatTime().raw.currentMinutes).to.equal('10');
    });

    it('Ignores { countdown: true } when the startTime has been set to 0', done => {
      const timer = new Timr()
        .changeOptions({ countdown: true })
        .ticker(({ formattedTime }) => {
          expect(formattedTime).to.equal('00:01');
          timer.destroy();
          done();
        })
        .start();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).changeOptions();
      expect(timer).equal(timer);
      timer.destroy();
    });
  });

  describe('setStartTime method', () => {
    it('Changes the startTime after Timr created', () => {
      const timer = new Timr(600);
      expect(timer.startTime).to.equal(600);
      timer.setStartTime(800);
      expect(timer.startTime).to.equal(800);
      timer.setStartTime('10m');
      expect(timer.startTime).to.equal(600);
    });

    it('Clears the existing timer and sets the ' +
      'currentTime and startTime to the new starTime', done => {
      const timer = new Timr(600).start();
      timer.ticker(({ currentTime }) => {
        expect(currentTime).to.equal(599);
        timer.setStartTime('11:00');
        expect(timer.getStartTime()).to.equal(660);
        expect(timer.getCurrentTime()).to.equal(660);
        done();
      });
    });

    it('Throws an error if the newly provided startTime is invalid', () => {
      const timer = new Timr(600);

      expect(() => timer.setStartTime('12-12')).to.throw(Error);
      expect(() => timer.setStartTime({})).to.throw(Error);
      expect(() => timer.setStartTime('invalid')).to.throw(Error);
    });

    it('Sets up a stopwatch if the newStartTime is falsy or 0', done => {
      const timer = new Timr(600);

      timer.setStartTime(0);

      timer.ticker(({ formattedTime, currentTime }) => {
        expect(formattedTime).to.equal('00:01');
        expect(currentTime).to.equal(1);
        timer.destroy();
        done();
      })
      .start();
    });

    it('Returns a reference to the Timr', () => {
      const timer = new Timr(600).setStartTime();
      expect(timer).equal(timer);
      timer.destroy();
    });
  });

  describe('getFt', () => {
    it('Returns the formattedTime.', () => {
      expect(new Timr(600).getFt()).to.equal('10:00');
    });
  });

  describe('getRaw', () => {
    it('Returns the raw values.', () => {
      expect(new Timr(600).getRaw()).to.deep.equal({
        totalDays: '00',
        totalHours: '00',
        totalMinutes: '10',
        totalSeconds: '600',
        currentDays: '00',
        currentHours: '00',
        currentMinutes: '10',
        currentSeconds: '00',
      });
    });
  });

  describe('getStartTime method', () => {
    it('Returns the currentTime in seconds', () => {
      expect(new Timr(600).getStartTime()).to.equal(600);
    });
  });

  describe('getCurrentTime method', () => {
    it('Returns the currentTime in seconds', () => {
      expect(new Timr(600).getCurrentTime()).to.equal(600);
    });
  });

  describe('isRunning method', () => {
    it('Returns false when the timer isnt running', () => {
      expect(new Timr(600).isRunning()).to.equal(false);
    });

    it('Returns true when the timer is running', () => {
      const timer = new Timr(600).start();
      expect(timer.isRunning()).to.equal(true);
      timer.stop();
    });
  });
});
