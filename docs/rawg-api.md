# RAWG Video Games Database API

## Overview

RAWG is the largest open video game database with 500,000+ games. The API provides metadata, covers, ratings, screenshots, and more.

Documentation: https://api.rawg.io/docs/

## Getting an API Key

1. Sign up at https://rawg.io/
2. Go to https://rawg.io/apidocs
3. Complete the developer info form to get your free API key

## Free Tier Limits

- **20,000 requests/month**
- Non-commercial only (or commercial for startups with <100k MAU / 500k pageviews/month)
- **Required**: Attribution backlink to RAWG on pages using their data
- **Required**: Active hyperlink from every page where data is used

For commercial use beyond free tier: email api@rawg.io

## Rate Limits

No explicit rate limit documented. Throttling may apply based on server load.

## Base URL

```
https://api.rawg.io/api
```

## Authentication

Append `?key=YOUR_API_KEY` to every request.

## Key Endpoints

### Games Search/List
```
GET https://api.rawg.io/api/games?key=YOUR_KEY
GET https://api.rawg.io/api/games?key=YOUR_KEY&search=elden+ring
GET https://api.rawg.io/api/games?key=YOUR_KEY&dates=2024-01-01,2024-12-31&ordering=-added
GET https://api.rawg.io/api/games?key=YOUR_KEY&platforms=18,1,7&metacritic=80,100
```

### Game Details
```
GET https://api.rawg.io/api/games/{id}?key=YOUR_KEY
```

### Genres, Platforms, Developers, Publishers
```
GET https://api.rawg.io/api/genres?key=YOUR_KEY
GET https://api.rawg.io/api/platforms?key=YOUR_KEY
GET https://api.rawg.io/api/developers?key=YOUR_KEY&search=name
GET https://api.rawg.io/api/publishers?key=YOUR_KEY&search=name
```

## Response Shape (Games List)

```json
{
  "count": 500000,
  "next": "https://api.rawg.io/api/games?page=2&key=...",
  "results": [
    {
      "id": 1234,
      "name": "Elden Ring",
      "released": "2022-02-25",
      "background_image": "https://media.rawg.io/media/games/456/456...",
      "rating": 4.5,
      "metacritic": 96,
      "genres": [{"id": 4, "name": "Action"}, {"id": 3, "name": "RPG"}],
      "platforms": [{"platform": {"id": 18, "name": "PlayStation 4"}}],
      "stores": [{"store": {"id": 3, "name": "GOG"}}]
    }
  ]
}
```

## Game Details Response

```json
{
  "id": 1234,
  "name": "Elden Ring",
  "description": "...",
  "released": "2022-02-25",
  "background_image": "https://...",
  "background_image_additional": "https://...",
  "clip": { "clip": "...", "video": "..." },
  "rating": 4.5,
  "metacritic": 96,
  "genres": [...],
  "platforms": [...],
  "stores": [...],
  "developers": [...],
  "publishers": [...],
  "tags": [...],
  "website": "...",
  "metacritic_url": "https://www.metacritic.com/...",
  "playtime": 45,
  "ratings_count": 15000,
  "slug": "elden-ring",
  "tba": false
}
```

## Image URL Construction

RAWG provides image URLs in responses. Use these directly:

```ts
// From game response
const coverUrl = game.background_image;
const additionalImage = game.background_image_additional;

// RAWG CDN image resizing (documented approach)
const resized = coverUrl.replace(/media\./, 'media-resized/');
```

## Filtering & Sorting

```
?dates=2019-09-01,2019-09-30     # release date range
?ordering=-metacritic            # sort by rating (desc)
?ordering=-added                 # sort by popularity
?search=elden ring               # fuzzy search
?search_precise=true            # exact search
?search_exact=true               # exact match
?genres=4,5                     # genre IDs
?platforms=18,1,7               # platform IDs (18=PS4, 1=PC, 7=Android)
?stores=3                        # store ID (3=GOG, 1=Steam, 2=Epic)
?developers=3147                 # developer ID
?publishers=1133                 # publisher ID
?metacritic=80,100              # metacritic score range
```

## Known Issues

- **Cover images**: RAWG has box art but may require additional API calls to get the specific size you need. Some images may be user-uploaded and vary in quality.
- **EGS/GOG titles**: Not all games on EGS/GOG are in RAWG. Fallback to manual metadata entry may be needed.
- **Attribution**: Every page displaying RAWG data must have a backlink to RAWG. This is a ToS requirement for the free tier.

## OpenLauncher Integration Notes

For OpenLauncher, RAWG should be used to:
1. **Search** for a game by name to get its metadata
2. **Fetch cover art** for the game
3. **Store links** — get where the game can be bought
4. **Platform info** — determine if it's available on Linux

Do NOT use RAWG data to replace the local game database. RAWG is a lookup service, not a sync target.

The typical flow:
1. User adds a game manually (exe path)
2. OpenLauncher searches RAWG by game name
3. User selects the correct match
4. RAWG metadata (cover, description, genre) is cached locally
5. Store integration fetches real purchase links from store APIs

## Node.js Wrapper

Community-maintained: https://github.com/orels1/rawger

```ts
import RAWG from 'rawger';
// or use raw HTTP calls with fetch
const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(name)}`);
const data = await res.json();
```

## ToS Summary

- Non-commercial: free with attribution
- Commercial (startups <100k MAU): free with attribution
- Larger commercial: contact api@rawg.io
- No data redistribution
- Must link back to RAWG on pages using their data