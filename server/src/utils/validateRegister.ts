import RegisterOptions from '../resolvers/RegisterOptions';

const validateRegister = (options: RegisterOptions) => {
    if (!options.email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'invalid email'
            }
        ];
    }

    const minEmailLength = 6;
    if (options.email.length <= minEmailLength) {
        return [
            {
                field: 'email',
                message: `length must be greater than ${minEmailLength}`
            }
        ];
    }

    const minPasswordLength = 4;
    if (options.password.length <= minPasswordLength) {
        return [
            {
                field: 'password',
                message: `length must be greater than ${minPasswordLength}`
            }
        ];
    }

    return null;
};

export default validateRegister;
