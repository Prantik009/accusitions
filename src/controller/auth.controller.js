import logger from '#config/logger.js';
import { createUser, authenticateUser } from '#services/auth.service.js';
import { cookies } from '#utils/cookies.js';
import { formatValidationError } from '#utils/format.js';
import { jtwtoken } from '#utils/jwt.js';
import { signupSchema, signInSchema } from '#validations/auth.validations.js';


export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if(!validationResult.success){
      return res.status(400).json({
        error: 'validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const {name, email, password, role} = validationResult.data;

    // AUTH SERVICE
    //creating new user with password hash
    const user = await createUser({name, email, password, role});
    //assigning token to that user. 
    const token = jtwtoken.sign({id: user.id, email: user.email, role: user.role});
    //setting cookies
    cookies.set(res, 'token', token);

    logger.info(`User regsitered successfully: ${email}`);
    res.status(201).json({
      message: 'User registered',
      user: {
        id:user.id,
        name: user.name,
        email: user.email, 
        role: user.role
      }
    });
  } catch (e) {
    logger.error('Signup error', e);

    if(e.message === 'User with this email already exists'){
      return res.status(409).json({ error: 'Email already exists'});
    }
    next(e);
  }
};

export const signin = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'validation failed',
        details: formatValidationError(validationResult.error)
      });
    }

    const { email, password } = validationResult.data;

    // AUTH SERVICE
    // Authenticate user with email and password
    const user = await authenticateUser({ email, password });
    // Generate JWT token for the authenticated user
    const token = jtwtoken.sign({ id: user.id, email: user.email, role: user.role });
    // Set secure cookie
    cookies.set(res, 'token', token);

    logger.info(`User signed in successfully: ${email}`);
    res.status(200).json({
      message: 'User signed in successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (e) {
    logger.error('Sign-in error', e);

    if (e.message === 'User not found') {
      return res.status(404).json({ error: 'User not found' });
    }
    if (e.message === 'Invalid password') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    next(e);
  }
};

export const signout = async (req, res, next) => {
  try {
    // Get token from cookie before clearing
    const token = cookies.get(req, 'token');
    let userEmail = 'unknown';

    if (token) {
      try {
        const decoded = jtwtoken.verify(token);
        userEmail = decoded.email;
      } catch (tokenError) {
        // Token might be invalid/expired, but we still want to clear it
        logger.warn('Invalid token during signout', tokenError);
      }
    }

    // Clear the authentication cookie
    cookies.clear(res, 'token');

    logger.info(`User signed out successfully: ${userEmail}`);
    res.status(200).json({
      message: 'User signed out successfully'
    });
  } catch (e) {
    logger.error('Sign-out error', e);
    next(e);
  }
};
