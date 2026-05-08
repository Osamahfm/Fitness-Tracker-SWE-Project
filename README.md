# Fitness Tracker Web Application

A comprehensive web-based fitness tracking platform built with PHP backend and modern frontend. Track activities, monitor nutrition, set goals, and achieve your fitness objectives.

## Features

### Core Functionality
- **User Authentication** (R5, R10): Secure registration, login, and session management
- **Activity Logging** (R1): Log various physical activities with distance, duration, and intensity
- **Calorie Calculation Engine** (R4): Accurate calorie burn calculations using MET values
- **Meal Tracking** (R3): Log meals with detailed nutritional information
- **Goal Setting & Tracking** (R2): Set fitness goals with personalized recommendations
- **Daily Reports** (R7): Comprehensive dashboard with progress tracking
- **Activity Reminders** (R6): Notification system for scheduled activities

### Technical Features
- **Performance Optimized** (R9): Sub-5 second page load times
- **Reliable Architecture** (R8): Robust backend design for 95%+ uptime
- **Modern UI/UX**: Clean, responsive design inspired by leading fitness apps
- **RESTful API**: Well-structured backend endpoints
- **Database Optimization**: Indexed queries and pre-calculated summaries

## Technology Stack

### Backend
- **PHP 8+**: Object-oriented with design patterns
- **MySQL 8.0**: Relational database with optimized schema
- **PDO**: Database abstraction layer
- **RESTful API**: Clean endpoint structure

### Frontend
- **HTML5/CSS3**: Modern web standards
- **Tailwind CSS**: Utility-first CSS framework
- **Vanilla JavaScript**: No heavy framework dependencies
- **Font Awesome**: Icon library
- **Responsive Design**: Mobile-friendly interface

### Architecture Patterns
- **MVC Pattern**: Separation of concerns
- **Service Layer**: Business logic abstraction
- **Singleton Pattern**: Database connection management
- **Strategy Pattern**: Calorie calculation methods

## Database Schema

The application uses a comprehensive MySQL schema with the following main tables:

- **users**: User profiles and authentication data
- **activities**: Logged physical activities
- **meals**: Meal and nutrition tracking
- **goals**: User fitness goals and targets
- **daily_summaries**: Pre-calculated daily statistics
- **user_sessions**: Authentication session management

## Installation

### Prerequisites
- PHP 8.0 or higher
- MySQL 8.0 or higher
- Apache or Nginx web server
- Composer (for dependency management)

### Setup Steps

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd Fitness-Tracker-SWE-Project
   ```

2. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p
   CREATE DATABASE fitness_tracker;
   
   # Import schema
   mysql -u root -p fitness_tracker < database/schema.sql
   ```

3. **Configure Database**
   ```bash
   # Update database credentials
   cp backend/config/database.example.php backend/config/database.php
   # Edit database.php with your credentials
   ```

4. **Web Server Configuration**

   **Apache (.htaccess)**
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^api/(.*)$ backend/api/$1.php [L]
   RewriteRule ^(.*)$ public/$1 [L]
   ```

   **Nginx**
   ```nginx
   location /api/ {
       rewrite ^/api/(.*)$ /backend/api/$1.php last;
   }
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

5. **Set Permissions**
   ```bash
   chmod -R 755 public/
   chmod -R 755 backend/
   ```

6. **Access the Application**
   Open your browser and navigate to `http://localhost/Fitness-Tracker-SWE-Project`

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/validate` - Session validation
- `POST /api/auth/change-password` - Password change

### Activities
- `POST /api/activities` - Log new activity
- `GET /api/activities` - Get user activities
- `PUT /api/activities?id={id}` - Update activity
- `DELETE /api/activities?id={id}` - Delete activity

### Meals
- `POST /api/meals` - Log new meal
- `GET /api/meals` - Get user meals
- `PUT /api/meals?id={id}` - Update meal
- `DELETE /api/meals?id={id}` - Delete meal

### Goals
- `POST /api/goals` - Create new goal
- `GET /api/goals/active` - Get active goal
- `GET /api/goals/all` - Get all goals
- `GET /api/goals/recommendations` - Get goal recommendations
- `PUT /api/goals?id={id}` - Update goal
- `DELETE /api/goals?id={id}` - Deactivate goal

### Dashboard
- `GET /api/dashboard/today` - Today's summary
- `GET /api/dashboard/weekly` - Weekly summary
- `GET /api/dashboard/stats` - User statistics

## Performance Optimization

### Database Optimization
- **Indexed Queries**: All frequently queried columns are indexed
- **Pre-calculated Summaries**: Daily statistics stored in separate table
- **Connection Pooling**: Persistent database connections
- **Query Optimization**: Efficient SQL with proper JOINs

### Frontend Optimization
- **Lazy Loading**: Components loaded as needed
- **Caching**: Browser caching for static assets
- **Minified Assets**: CSS and JavaScript optimization
- **CDN Ready**: External resources loaded from CDNs

### Backend Optimization
- **Response Caching**: API responses cached where appropriate
- **Database Connection Reuse**: Singleton pattern implementation
- **Efficient Data Structures**: Optimized PHP classes
- **Error Handling**: Graceful error management

## Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **Session Management**: Secure session handling with expiration
- **SQL Injection Prevention**: Prepared statements throughout
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based request validation
- **Input Validation**: Comprehensive server-side validation

## Testing

### Unit Tests
```bash
# Run PHP unit tests
php vendor/bin/phpunit tests/
```

### Integration Tests
```bash
# Run API integration tests
php tests/api/integration.php
```

### Performance Testing
```bash
# Run performance benchmarks
php tests/performance/benchmark.php
```

## Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   # Set environment variables
   export APP_ENV=production
   export DB_HOST=localhost
   export DB_NAME=fitness_tracker
   export DB_USER=your_username
   export DB_PASS=your_password
   ```

2. **SSL Configuration**
   - Install SSL certificate
   - Configure HTTPS redirects
   - Update security headers

3. **Backup Strategy**
   ```bash
   # Database backup script
   mysqldump -u root -p fitness_tracker > backup.sql
   ```

## Monitoring & Maintenance

### Performance Monitoring
- Page load time tracking
- Database query performance
- API response time monitoring
- Error rate tracking

### Regular Maintenance
- Database optimization
- Log file rotation
- Security updates
- Performance tuning

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Review the documentation
- Check the FAQ section

## Roadmap

### Future Enhancements
- Mobile application (React Native)
- Wearable device integration
- Advanced analytics and reporting
- Social features and challenges
- Premium subscription features

### Technical Improvements
- Microservices architecture
- Real-time notifications
- Machine learning recommendations
- Advanced caching strategies
- API rate limiting

---

**Built with ❤️ for fitness enthusiasts**
