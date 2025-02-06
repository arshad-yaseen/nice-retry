import {retry} from './build/index.mjs';

let prevAttemptTime = Date.now();

const mayFail = () => {
  const currentAttemptTime = Date.now();
  const timeSincePrevAttempt = currentAttemptTime - prevAttemptTime;
  prevAttemptTime = currentAttemptTime;
  console.log(`Time since previous attempt: ${timeSincePrevAttempt}ms`);

  if (Math.random() < 0.7) {
    throw new Error('Failed');
  }
  return 'Success';
};

const main = async () => {
  try {
    const result = await retry.async(mayFail, {
      maxAttempts: 10,
    });
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
};

void main();
