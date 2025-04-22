# Five Words Poetry Game

A collaborative poetry game where players create poems using five random words, with anonymous voting and score tracking.

## Game Rules

1. A lead user initiates a round with up to five players
2. The game provides five random words
3. All players use these words to compose poems in any format
4. After a timed period, poems are submitted anonymously to the lead user
5. The lead user selects their favorite poem
6. The author of the chosen poem receives a point
7. The role of lead user rotates to the next player
8. The game continues until all players have experienced both writing and judging

## Technologies Used

- **Frontend**: React, TailwindCSS, Shadcn/UI
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: React Query

## Features

- User authentication and session management
- Real-time game state updates
- Poem writing interface with auto-save
- Anonymous poem submission and judging
- Score tracking and leaderboard
- Timed writing rounds
- Random word generation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

### Installation

1. Clone the repository
   ```
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up your PostgreSQL database and update the connection string in environment variables

4. Run database migrations
   ```
   npm run db:push
   ```

5. Start the development server
   ```
   npm run dev
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.