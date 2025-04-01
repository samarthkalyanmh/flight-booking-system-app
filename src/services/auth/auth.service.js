const { User } = require('../../models');
const { generateToken } = require('../../config/jwt');
const AppError = require('../../utils/AppError');
const { validateUserRegistration } = require('../../utils/validators');

class AuthService {

  async register(userData) {

    // Validate user data
    validateUserRegistration(userData);
    
    const { name, email, password, role } = userData;

    // Check if user already exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      throw new AppError(
        'User with this email already exists',
        400,
        AppError.TYPES.CONFLICT_ERROR
      );
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'user' // Only allow admin role if specified
    });

    // Generate token
    const token = generateToken({ id: user.id });

    const userResponse = user.toJSON();
    delete userResponse.password; // Excluding password in response

    return {
      user: userResponse,
      token
    };
  }

  async login(credentials) {
    const { email, password } = credentials;

    // Check if email and password are provided
    if (!email || !password) {
      throw new AppError(
        'Please provide email and password',
        400,
        AppError.TYPES.VALIDATION_ERROR
      );
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError(
        'Invalid credentials',
        401,
        AppError.TYPES.AUTHENTICATION_ERROR
      );
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError(
        'Invalid credentials',
        401,
        AppError.TYPES.AUTHENTICATION_ERROR
      );
    }

    const token = generateToken({ id: user.id });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return {
      user: userResponse,
      token
    };
  }

  async getUserById(userId) {
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new AppError(
        'User not found',
        404,
        AppError.TYPES.NOT_FOUND_ERROR
      );
    }
    
    const userResponse = user.toJSON();
    delete userResponse.password;
    
    return userResponse;
  }
}

module.exports = new AuthService();
