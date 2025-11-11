import express from "express";
import cors from "cors";
import ical from "ical";
import NodeCache from "node-cache";
const app = express();

const port = process.env.PORT || 5000;
const CACHE_TTL_SECONDS = 600; // 10 minutes
app.use(cors());

/**
 * Base class for custom application errors.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
class ClientError extends AppError {
  constructor(message, statusCode = 400) {
    super(message, statusCode);
  }
}
const icalCache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS });
/**
 * Converts a Date object to a number in YYYYMMDD format.
 * @param date The date to convert.
 * @returns The date as a number (e.g., 20240721), or 0 if the date is invalid.
 */
function dateToYyyymmdd(date) {
  if (!date || isNaN(date.getTime())) return 0;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return parseInt(`${y}${m}${d}`);
}
/**
 * Fetches iCal data from the Celcat server, using a cache.
 * @param groupId The group ID for the schedule.
 * @returns The iCal data as a string.
 * @throws An error if the fetch fails or returns a non-200 status.
 */
async function fetchIcalData(groupId) {
  const cachedData = icalCache.get(groupId);
  if (cachedData) {
    return cachedData;
  }
  const response = await fetch(`https://celcat.rambouillet.iut-velizy.uvsq.fr/cal/ical/${groupId}/schedule.ics`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new ClientError(`No schedule found for group ID: ${groupId}`, 404);
    }
    // For other errors (500, 503, etc.), treat it as a server-side issue.
    throw new AppError(`Failed to fetch iCal data from Celcat. Status: ${response.status}`, 502); // 502 Bad Gateway
  }
  const data = await response.text();
  icalCache.set(groupId, data);
  return data;
}
/**
 * Parses iCal data and returns a sorted list of calendar events.
 * @param icalData The raw iCal data string.
 * @returns An array of CalendarEvent objects.
 */
function parseIcalData(icalData) {
  const calendar = ical.parseICS(icalData);
  const events = Object.values(calendar) // calendar values are of type any
    .filter((event) => event.type === "VEVENT")
    .map((event) => {
      // Reset seconds and milliseconds for consistent time comparison
      event.start.setSeconds(0, 0);
      event.end.setSeconds(0, 0);
      return {
        uid: event.uid,
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location,
        description: event.description,
      };
    });
  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}
/**
 * Retrieves and filters the timetable for a specific group and date range.
 * @param groupId The group ID.
 * @param startDate The start date for filtering.
 * @param endDate The optional end date for filtering.
 * @returns A promise that resolves to an array of filtered calendar events.
 */
async function getTimetable(groupId, startDate, endDate) {
  const icalData = await fetchIcalData(groupId);
  const allEvents = parseIcalData(icalData);
  const startYyyymmdd = dateToYyyymmdd(startDate);
  // If no end date, filter for the start date plus a few days as a default range.
  const endYyyymmdd = endDate ? dateToYyyymmdd(endDate) : startYyyymmdd + 5;
  return allEvents.filter((event) => {
    const eventYyyymmdd = dateToYyyymmdd(event.start);
    return eventYyyymmdd >= startYyyymmdd && eventYyyymmdd <= endYyyymmdd;
  });
}
app.get("/edt/:groupId", async (req, res, next) => {
  const { groupId } = req.params;
  const { start, end } = req.query;
  if (!start) throw new ClientError("Missing 'start' query parameter.");
  const startDate = new Date(start.toString());
  if (isNaN(startDate.getTime())) throw new ClientError("Invalid 'start' date format.");
  const endDate = end ? new Date(end.toString()) : undefined;
  if (end && isNaN(endDate.getTime())) throw new ClientError("Invalid 'end' date format.");
  try {
    const timetable = await getTimetable(groupId, startDate, endDate);
    res.status(200).json(timetable);
  } catch (error) {
    next(error); // Pass error to the central error handler
  }
});
app.post("/ping", (req, res) => {
  res.status(200).send("pong");
});
// Centralized error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    console.error(`[${req.method} ${req.path}] AppError ${err.statusCode}: ${err.message}`);
    return res.status(err.statusCode).json({ error: err.message });
  }
  // For unexpected errors
  console.error(err.stack); // Log the full stack for debugging
  res.status(500).json({ error: "An unexpected internal server error occurred." });
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
