export function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

function between(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
  }
  

export function naturalDelay() {
    return delay(between(1000, 3000));
}

export function useDb() {
    return process.env.USE_DB == 'true';
}