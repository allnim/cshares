
class MetaPress_Token_Ratio_Manager {
    constructor() {
      this.binance_api_url = 'https://api.binance.com/api/v3/ticker/price';
      this.coingeck_api_url ='https://api.coingecko.com/api/v3/simple/price';
    }

    async get_binance_token_ratio(token) {
        let convertAPIURL = this.binance_api_url+'?symbol='+token+'USDT';
        let token_data = await jQuery.get(convertAPIURL);
        if( token_data.price ) {
            let new_token_ratio = 1 / token_data.price;
            return new_token_ratio;
        } else {
            if( token == 'ETH' || token == 'MATIC' ) {
                let new_token_ratio = await this.get_coingecko_token_ratio(token);
                return new_token_ratio;
            } else {
                return 0;
            }
        }
    }

    async get_coingecko_token_ratio(token) {
        if( token == 'ETH' ) {
            let convertAPIURL = this.coingeck_api_url+'?ids=ethereum&vs_currencies=usd';
            let token_data = await jQuery.get(convertAPIURL);
            if( token_data.ethereum.usd ) {
                let new_token_ratio = 1 / token_data.ethereum.usd;
                return new_token_ratio;
            } else {
              return 0;
            }
        }
        if( token == 'MATIC' ) {
            let convertAPIURL = this.coingeck_api_url+'?ids=matic-network&vs_currencies=usd';
            let token_data = await jQuery.get(convertAPIURL);
            if( token_data['matic-network']['usd'] ) {
                let new_token_ratio = 1 / token_data['matic-network']['usd'];
                return new_token_ratio;
            } else {
              return 0;
            }
        }
    }

    async get_coingecko_token(network, token_address, token) {
        if( network == 'mainnet' || network == 'ropsten' ) {
            let contract_info_url = 'https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses='+token_address+'&vs_currencies=usd';
            let token_data = await jQuery.get(contract_info_url);

            if( token_data && token_data[token_address] && token_data[token_address].usd ) {
                let new_token_ratio = 1 / token_data[token_address].usd;
                return new_token_ratio;
            } else {
                let new_token_ratio = await this.get_binance_token_ratio(token);
                return new_token_ratio;
            }
        }

        if( network == 'maticmainnet' || network == 'matictestnet' ) {
          let contract_info_url = 'https://api.coingecko.com/api/v3/simple/token_price/polygon-pos?contract_addresses='+token_address+'&vs_currencies=usd';
          let token_data = await jQuery.get(contract_info_url);

          if( token_data && token_data[token_address] && token_data[token_address].usd ) {
              let new_token_ratio = 1 / token_data[token_address].usd;
              return new_token_ratio;
          } else {
              let new_token_ratio = await this.get_binance_token_ratio(token);
              return new_token_ratio;
          }
        }

    }
}
const metapress_token_ratio_manager = new MetaPress_Token_Ratio_Manager();
