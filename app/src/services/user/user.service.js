import { API_BASE, API_RFID, API_USERS, API_TRANSACTIONS } from 'common/constants';

import { isRfid } from 'common/utils';
import { http } from 'services/net';
import { User, jsonToUser } from './user';

import { Observable } from 'rxjs';

export class UserServiceProvider {
  getUser(rfid) {
    if (isRfid(rfid)) {
      return http.get(`${API_BASE}${API_USERS}`, {
        rfid,
      }).flatMap((ret) => {
        if (ret.count === 1) {
          const userData = ret.results[0];
          return Observable.of(jsonToUser(userData));
        } else if (ret.count > 1) {
          return Observable.throw({ type: 2, message: 'Mer enn én bruker har denne RFIDen!' });
        }
        return Observable.throw({ type: 1, message: 'Validering feilet!' });
      });
    }
    return Observable.throw({ type: 2, message: 'Invalid RFID' });
  }

  updateSaldo(user, diff) {
    if ((typeof diff) === 'number') {
      if (!(diff + user.saldo < 0)) {
        user.updateSaldo(diff);
        return http.post(`${API_BASE}${API_TRANSACTIONS}`, {
          user: user.id,
          amount: diff,
        }).catch(() => {
          user.updateSaldo(-diff);
          return Observable.throw('Noe gikk galt da vi oppdaterte saldoen på serveren.');
        });
      }
    }
    return Observable.throw('Saldo er ikke et tall!');
  }

  bindRfid(username, password, rfid, options) {
    if (isRfid(rfid)) {
      const data = {
        username,
        password,
        rfid,
        magic_link: options ? options.magic_link : false,
        send_email: options ? options.send_email : false,
      };
      return http.post(`${API_BASE}${API_RFID}`, data);
    }

    return Observable.throw('Invalid RFID');
  }
}

export class DevUserSerivce {
  getUser() {
    return Observable.of(new User(-1, 'Dev', 'User', 600));
  }

  updateSaldo(user, diff) {
    if ((typeof diff) === 'number') {
      if (!(diff + user.saldo < 0)) {
        user.updateSaldo(diff);
      }
    }
    return Observable.throw('');
  }

  bindRfid(username, password, rfid) {
    if (isRfid(rfid)) {
      return Observable.of('OK');
    }

    return Observable.throw('Invalid RFID');
  }
}

export const userService = new UserServiceProvider();
