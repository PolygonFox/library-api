import { ensureUser } from '../../middleware/validators'
import * as media from './controller'

export const baseUrl = '/media'

export default [
  {
    method: 'POST',
    route: '/',
    handlers: [
      // user.createUser
    ]
  },
  {
    method: 'GET',
    route: '/:page',
    handlers: [
      // ensureUser,
      media.getMedia
    ]
  },
  // {
  //   method: 'GET',
  //   route: '/:id',
  //   handlers: [
  //     // ensureUser,
  //     // user.getUser
  //   ]
  // },
  // {
  //   method: 'PUT',
  //   route: '/:id',
  //   handlers: [
  //     // ensureUser,
  //     // user.getUser,
  //     // user.updateUser
  //   ]
  // },
  {
    method: 'DELETE',
    route: '/:id',
    handlers: [
      // ensureUser,
      // user.getUser,
      // user.deleteUser
    ]
  }
]
