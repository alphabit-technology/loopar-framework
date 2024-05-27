import { format as Format, setHours, setMinutes, setSeconds, parse } from 'date-fns';

const getDate = (date=new Date(), format) => {
  if(!date) return null;

  if(format){
    if(typeof date === "string"){
      date = parse(new Date(date).toString(), 'yyyy-MM-dd', new Date());
    } else if(typeof date === "object"){
      date = new Date(date);
    }else{
      return null;
    }

    return Format(date, format === "DB" ? 'yyyy-MM-dd' : format);
  }

  return typeof date === "object" ? date : new Date(date);
}

const getDateTime = (date=new Date(), format) => {
  if (!date) return null;

  if (format) {
    if (typeof date === "string") {
      date = parse((new Date(date)).toString(), 'yyyy-MM-dd HH:mm:ss', new Date());
    } else if (typeof date === "object") {
      date = new Date(date);
    } else {
      return null;
    }

    if(date == "Invalid Date") return null;

    return Format(date, format === "DB" ? 'yyyy-MM-dd HH:mm:ss' : format);
  }

  return typeof date === "object" ? date : new Date(date);
}

const getTime = (date = new Date(), format) => {
  if(!date) return null;
  let time = typeof date === "string" ? new Date(date) : date;

  if(typeof date === "string"){
    if(time == "Invalid Date"){
      const [hours, minutes, seconds] = date.split(":");
    
      if(hours && minutes){
        time = new Date();
        time = setHours(time, hours);
        time = setMinutes(time, minutes);
        //time = setSeconds(time, "00");
      }else{
        time = null;
      }
    }
  }

  /**Because our time widget doesn't control the seconds yet.*/
  time = setSeconds(time, "00");
  
  if (format) {
    format = format === "DB" ? 'HH:mm:ss' : format;

    return Format(time, format);
  }

  return time;
}

export {
  getDate,
  getDateTime,
  getTime
}