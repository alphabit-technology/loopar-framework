import React, { useEffect, useState, useRef, MouseEvent } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import loopar from "loopar";
import dayjs from "dayjs";

/*interface MarkPosition {
  x: number;
  y: number;
}*/

interface PropsInterface {
  handleChange: Function,
  value: string
}

const getTime = (time: string) => {
  if (!time || typeof time == "object") return dayjs(time).format("HH:mm");
  time = dayjs(time).format("HH:mm");

  const date = new Date();
  const [hours = 0, minutes = 0] = time.split(":").map((value) => parseInt(value) || 0);
  date.setHours(hours);
  date.setMinutes(minutes);

  return loopar.utils.formatTime(date);
}

const AnalogTimePicker: React.ElementType = (props: PropsInterface) => {
  const { handleChange, value } = props;
  const [hours, minutes] = getTime(value).split(":").map(value => parseInt(value));

  const [AmPm, setAmPm] = useState<string>(hours > 12 ? "PM" : "AM");
  const [selectorType, setSelectorType] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(hours);
  const [selectedMinute, setSelectedMinute] = useState<number>(minutes);
  const [dragging, setDragging] = useState<boolean>(false);

  const clockRef = useRef<HTMLDivElement>(null);

  const [clockSize, markSize] = [200, 20];
  const clockRadius = clockSize / 2;
  const markRadius = clockRadius - markSize / 2;
  const hourColor = "bg-slate-500";
  const minuteColor = "bg-green-500";

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const typeSelector = e.currentTarget.getAttribute("type-selector");
    if (typeSelector) {
      setSelectorType(typeSelector);
    }
    setDragging(true);
    updateHourFromMouseEvent(e);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (dragging && clockRef.current) {
      updateHourFromMouseEvent(e);
    }
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectorType(null);
    setDragging(false);
  };

  const updateHourFromMouseEvent = (e: MouseEvent<HTMLDivElement>) => {
    if (clockRef.current) {
      const rect = clockRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX) + Math.PI / 2;
      let degrees = (angle * (180 / Math.PI) + 360) % 360;

      if (selectorType === "Minutes") {
        const minutes = Math.round(degrees / 6) % 60;
        setSelectedMinute(isNaN(minutes) ? 0 : minutes);
        setTimeHandler(`${selectedHour}:${minutes}`);
      } else if (selectorType === "Hours") {
        const hours = Math.round(degrees / 30) % 12 || 12;
        setHour(isNaN(hours) ? 0 : hours);
      }
    }
  };

  const setTimeHandler = (value: string) => {
    handleChange && handleChange(value);
  }

  const amPmHandler = (value: string) => {
    setAmPm(value);
  }

  useEffect(() => {
    setHour(selectedHour);
  }, [AmPm, selectedHour]);

  useEffect(() => {
    setTimeHandler(`${selectedHour}:${selectedMinute}`);
  }, [selectedHour, selectedMinute]);


  const setHour = (hour = selectedHour) => {
    let newHour = hour;

    if (AmPm === "PM") {
      newHour = hour < 12 ? hour + 12 : hour;
    } else {
      newHour = hour >= 12 ? hour - 12 : hour;
    }

    setSelectedHour(newHour);
  };


  /*const handleHourSelection = (hourIndex) => {
    setSelectedHour(hourIndex + 1);
  };

  const selectHour = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;

    const angle = Math.atan2(clickY - centerY, clickX - centerX) * (180 / Math.PI);
    const hour = Math.round(((angle + 360) % 360) / 30) || 12;
    
    selectorType === "Minutes" ? setSelectedMinute(hour + 3) : setSelectedHour(hour + 3);
  };*/

  /*const calculateMarkPosition = (index:Number) => {
    const angle = (Number(index) * 30) * (Math.PI / 180);

    const x = clockRadius + markRadius * Math.cos(angle) - markSize / 2;
    const y = clockRadius + markRadius * Math.sin(angle) - markSize / 2;
    return { x, y };
  };*/

  const calculateMarkPosition = (index: number, isHourMark: boolean) => {
    const angle = (index * (isHourMark ? 30 : 6)) * (Math.PI / 180);
    const radius = isHourMark ? markRadius - 15 : markRadius;
    const x = clockRadius + radius * Math.cos(angle) - (isHourMark ? markSize / 2 : 1);
    const y = clockRadius + radius * Math.sin(angle) - (isHourMark ? markSize / 2 : 1);
    return { x, y };
  };

  return (
    <div className="flex flex-col items-center p-2">
      <div className="flex w-full items-center justify-end">
        <ToggleGroup type="single" defaultValue={AmPm} value={AmPm}>
          <ToggleGroupItem onClick={() => amPmHandler("AM")} value="AM">Am</ToggleGroupItem>
          <ToggleGroupItem onClick={() => amPmHandler("PM")} value="PM">Pm</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={`relative rounded-full border-4 border-slate-600`}
        style={{ width: clockSize + 10, height: clockSize + 10, padding: 85 }}
        ref={clockRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onMouseUp={handleMouseUp}
      >
        {/*Hours marks*/}
        {Array.from({ length: 12 }).map((_, index) => {
          const { x, y } = calculateMarkPosition(index, true);
          const hour = index + 3 > 12 ? index - 9 : index + 3;
          return (
            <div
              key={index}
              className="absolute h-5 w-5 select-none rounded-full text-center leading-5"
              style={{ left: x, top: y }}
            >{hour}</div>
          );
        })}

        {/*Marks*/}
        {Array.from({ length: 60 }).map((_, index) => {
          const isHourMark = index % 5 === 0;
          const { x, y } = calculateMarkPosition(index, false);

          return (
            <div
              key={`mark-${index}`}
              className={`absolute rounded-full ${isHourMark ? hourColor : minuteColor}`}
              style={{
                left: x, top: y, width: 6, height: 1,
                ...(isHourMark ? { left: x - 3, width: 10, height: 3 } : {}),
                transform: `rotate(${index * 6}deg)`,
              }}
            />
          );
        })}
        <div className={`rounded-full ${hourColor}`} style={{ width: '100%', height: '100%' }}>
          {/*Hour hand*/}
          <div
            className={`absolute cursor-grab rounded ${hourColor}`}
            type-selector="Hours"
            style={{
              width: 18,
              height: `${clockRadius * (0.6)}px`,
              left: 'calc(50% - 9px)',
              bottom: '50%',
              transform: `rotate(${(selectedHour % 12) * 30}deg)`,
              transformOrigin: '50% 100%',
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
          {/*Minutes Hand*/}
          <div
            className={`absolute w-[12px] cursor-grab rounded ${minuteColor}`}
            type-selector="Minutes"
            style={{
              height: `${clockRadius * (0.85)}px`,
              left: 'calc(50% - 6px)',
              bottom: '50%',
              transform: `rotate(${(selectedMinute % 60) * 6}deg)`,
              transformOrigin: '50% 100%'
            }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          />
          {/*Minutes hand center*/}
          <div
            className={`absolute h-6 w-6 rounded-full ${minuteColor}`}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
          {/*Center dot*/}
          <div
            className="absolute h-4 w-4 rounded-full bg-slate-800"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalogTimePicker;
