const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth')

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                return User.findOne({_id: context.user_id}).populate('savedBooks').select('password');
            }
            throw new AuthenticationError('You must login to continue')
        }
    },
    Mutation: {
        addUser: async (parent, {username, email, password}) => {
            const user = await User.create({ username, email, password });
            const token = signToken(user);
            return { token, user };
            },
        loginUser: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
            if(!user) {
                throw new AuthenticationError('Could not find user with this email address')
            }

            const correctPassword = await user.isCorrectPassword(password);
            if(!correctPassword) {
                throw new AuthenticationError('Incorrect email/password')
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (parent, { bookData }, context) => {
            if (context.user) {
                const book = await User.findByIdAndUpdate(
                    {_id: context.user._id}, {$push: { savedBooks: bookData }}, {new: true}
                );
                return book;
            }
            throw new AuthenticationError('You must login to continue')
        },
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const book = await User.findOneAndDelete(
                    {_id: context.user._id}, {$push: { savedBooks: bookId }}, {new: true}
                );
                return book;
            }
            throw new AuthenticationError('You must login to continue')
        }
    
    }
};

module.exports = resolvers;

