
class MetaPress_MetaMask_Loading_Manager {
    constructor() {
      this.mm_account_provider = null;
      this.mm_account_provider_name = null;
      this.metapress_transaction_viewing_url = 'https://ropsten.etherscan.io/';
      this.metapress_web3 = null;
      this.currentMMAccount = null;
      this.metapress_contract = null;
      this.token_ratio = 0;
      this.send_to_address = metapressmetamaskjsdata.send_to_address;
      if( metapressmetamaskjsdata.allowed_test_address && metapressmetamaskjsdata.allowed_test_address != "" ) {
        this.allowed_mm_test_address = metapressmetamaskjsdata.allowed_test_address.toLowerCase();
      } else {
        this.allowed_mm_test_address = null;
      }
    }
    async metapressCheckEthereumProvider() {
        this.mm_account_provider = await detectEthereumProvider();
        this.mm_account_provider.on('accountsChanged', (accounts) => {
            this.metapress_remove_token_param();
        });

        this.mm_account_provider.on('chainChanged', (chainId) => {
        if( chainId == '0x3' && this.currentMMAccount != this.allowed_mm_test_address ) {
            this.currentMMAccount = null;
            alert('Please change to Main Ethereum Network to use this site.');
            this.metapress_remove_token_param();
        }
        });

        this.mm_account_provider.on('networkChanged', (chainId) => {
            document.location.reload();
        });
    }

    async metapressGetUserMetaMaskAccount() {
        if( this.mm_account_provider.isMetaMask ) {
            // ropsten test
            if( this.mm_account_provider.chainId == '0x3' ) {
                this.metapress_transaction_viewing_url = 'https://ropsten.etherscan.io/';
                this.mm_account_provider_name = 'ropsten';
            }
            // ethereum
            if( this.mm_account_provider.chainId == '0x1' ) {
                this.metapress_transaction_viewing_url = 'https://etherscan.io/';
                this.mm_account_provider_name = 'mainnet';
            }

            // MATIC TESTNET
            if( this.mm_account_provider.chainId == '0x13881' ) {
                this.metapress_transaction_viewing_url = 'https://mumbai.polygonscan.com/';
                this.mm_account_provider_name = 'matictestnet';
            }

            if( this.mm_account_provider.chainId == '0x89' ) {
                this.metapress_transaction_viewing_url = 'https://polygonscan.com/';
                this.mm_account_provider_name = 'maticmainnet';
            }

            if( ! this.currentMMAccount  ) {
                const mm_accounts = await this.mm_account_provider.request({ method: 'eth_requestAccounts' });
                this.currentMMAccount = mm_accounts[0];
                if( this.mm_account_provider.chainId == '0x3' && this.currentMMAccount != this.allowed_mm_test_address ) {
                    this.currentMMAccount = null;
                    alert('Please change to Ethereum Mainnet Network to use this site.');
                }

                if( this.mm_account_provider.chainId == '0x13881' && this.currentMMAccount != this.allowed_mm_test_address ) {
                    this.currentMMAccount = null;
                    alert('Please change to Polygon Mainnet Network to use this site.');
                }

                if( metapressmetamaskjsdata.live_mode == 1 ) {
                  if( this.mm_account_provider.chainId == '0x13881' || this.mm_account_provider.chainId == '0x3' ) {
                    this.currentMMAccount = null;
                    alert('Please change to a Mainnet Network to use this site.');
                  }
                } else {
                  if( this.mm_account_provider.chainId == '0x1' || this.mm_account_provider.chainId == '0x89' ) {
                    this.currentMMAccount = null;
                    alert('Please change to a test Network to use this site.');
                  }
                }

                if( this.currentMMAccount && this.currentMMAccount != null ) {
                  jQuery('.metapress-access-buttons').addClass('show');
                  jQuery('.metapress-login-notice').remove();
                  jQuery(document).trigger('metapressMetaMaskAccountReady');
                }

            }

            if( this.metapress_web3 == null ) {
                this.metapress_web3 = new Web3(this.mm_account_provider);
                var metapress_manager = this;
                jQuery.getJSON(metapressmetamaskjsdata.abi, function() {}).done(function(abi) {
                  metapress_manager.contract_abi = abi;
                }).fail(function() {
                  metapress_manager.contract_abi = null;
                })

                jQuery.getJSON(metapressmetamaskjsdata.erc20_abi, function() {}).done(function(abi) {
                  metapress_manager.erc20_abi = abi;
                }).fail(function() {
                  metapress_manager.erc20_abi = null;
                })

                jQuery.getJSON(metapressmetamaskjsdata.erc721_abi, function() {}).done(function(abi) {
                  metapress_manager.erc721_abi = abi;
                }).fail(function() {
                  metapress_manager.erc721_abi = null;
                })

                jQuery.getJSON(metapressmetamaskjsdata.erc1155_abi, function() {}).done(function(abi) {
                  metapress_manager.erc1155_abi = abi;
                }).fail(function() {
                  metapress_manager.erc1155_abi = null;
                })


            }
        }
    }

    set_contract(network) {
        let metapress_contract_address = metapressmetamaskjsdata.contract_address[network];
        this.metapress_contract = new this.metapress_web3.eth.Contract(this.contract_abi, metapress_contract_address);
    }

    set_approval_contract(contract_address) {
        return new this.metapress_web3.eth.Contract(this.erc20_abi, contract_address);
    }

    set_721_nft_contract(contract_address) {
        return new this.metapress_web3.eth.Contract(this.erc721_abi, contract_address);
    }

    set_1155_nft_contract(contract_address) {
        return new this.metapress_web3.eth.Contract(this.erc1155_abi, contract_address);
    }

    async verify_erc20_owner(contract_address, product_id) {
        let nft_contract = this.set_approval_contract(contract_address);
        const metapress_manager = this;
        await nft_contract.methods.balanceOf(this.currentMMAccount).call({from: this.currentMMAccount}, function(error, balance) {
            if( error ) {
                jQuery('.metapress-access-buttons').addClass('show');
                jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                metapress_show_ajax_error(error.message);
                return {
                    'status': 'error',
                    'hash': null
                };
            }
            if( balance > 0 ) {
                metapress_manager.metapress_create_nft_access_token(product_id);
            } else {
                metapress_show_ajax_error('Verification failed');
            }
        });

    }

    async verify_721_nft_collection_owner(contract_address, product_id) {
        let nft_contract = this.set_721_nft_contract(contract_address);
        const metapress_manager = this;
        await nft_contract.methods.balanceOf(this.currentMMAccount).call({from: this.currentMMAccount}, function(error, balance) {
            if( error ) {
                jQuery('.metapress-access-buttons').addClass('show');
                jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                metapress_show_ajax_error(error.message);
                return {
                    'status': 'error',
                    'hash': null
                };
            }
            if( balance > 0 ) {
                metapress_manager.metapress_create_nft_access_token(product_id);
            } else {
                metapress_show_ajax_error('Verification failed');
            }
        });
    }

    async verify_721_nft_owner(token_id, contract_address, product_id) {
        let nft_contract = this.set_721_nft_contract(contract_address);
        const metapress_manager = this;
        await nft_contract.methods.ownerOf(token_id).call({from: this.currentMMAccount}, function(error, owner) {
            if( error ) {
                jQuery('.metapress-access-buttons').addClass('show');
                jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                metapress_show_ajax_error(error.message);
                return {
                    'status': 'error',
                    'hash': null
                };
            }
            if( owner.toLowerCase() === metapress_manager.currentMMAccount.toLowerCase() ) {
                metapress_manager.metapress_create_nft_access_token(product_id);
            } else {
                metapress_show_ajax_error('Verification failed');
            }
        });
    }

    async verify_1155_nft_owner(token_id, contract_address, product_id) {
        let nft_contract = this.set_1155_nft_contract(contract_address);
        const metapress_manager = this;
        await nft_contract.methods.balanceOf(this.currentMMAccount, token_id).call({from: this.currentMMAccount}, function(error, balance) {
            if( error ) {
                jQuery('.metapress-access-buttons').addClass('show');
                jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                metapress_show_ajax_error(error.message);
                return {
                    'status': 'error',
                    'hash': null
                };
            }
            if( balance > 0 ) {
                metapress_manager.metapress_create_nft_access_token(product_id);
            } else {
                metapress_show_ajax_error('Verification failed');
            }
        });

    }

    async makeContractPayment(product_id, product_price, token, contract_address) {
        this.set_contract(this.mm_account_provider_name);
        if( metapress_metamask_loading_manager.currentMMAccount && this.metapress_contract && this.mm_account_provider_name && this.token_ratio > 0 ) {

            var token_price = (product_price * this.token_ratio);
            token_price = token_price.toFixed(18).toString();
            var wei_amount = this.metapress_web3.utils.toWei(token_price, 'ether');

            // DIRECT TRANSACTION VIA SMART CONTRACT ON NETWORK
            if( token == 'ETH' || token == 'MATIC' ) {
                await this.metapress_contract.methods.smartTransfer(this.send_to_address).send({from: this.currentMMAccount, value: wei_amount}).on('transactionHash', (hash) => {
                    this.metapress_create_new_metamask_transaction(product_id, token, token_price, hash, 'pending', null);
                }).on('error', (error) => {
                    jQuery('.metapress-access-buttons').addClass('show');
                    return {
                        success: false,
                        error: error
                    }
                });
            } else {
                // MUST REQUEST SPENDING ALLOWANCE
                this.get_contract_approval(product_id, token, token_price, contract_address, wei_amount);
            }
        } else {
            jQuery('.metapress-access-buttons').addClass('show');
        }
     }

    async get_contract_approval(product_id, token, token_price, contract_address, wei_amount) {
        let approval_contract = this.set_approval_contract(contract_address);
        let metapress_contract_address = metapressmetamaskjsdata.contract_address[this.mm_account_provider_name];
        const metapress_manager = this;
        let token_allowance = await approval_contract.methods.allowance(this.currentMMAccount, metapress_contract_address).call({from: this.currentMMAccount}, function(error, result) {
            if( error ) {
                jQuery('.metapress-access-buttons').addClass('show');
                jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                metapress_show_ajax_error(error.message);
                return {
                    'status': 'error',
                    'hash': null
                };
            }
        });

        token_allowance = parseInt(token_allowance);
        if( token_allowance < wei_amount ) {
            if( token_allowance > 0 ) {
              console.log('need to set allowance to 0');
              await approval_contract.methods.approve(metapress_contract_address, 0).send({from: this.currentMMAccount}).on('error', function(error, receipt) {
                  jQuery('.metapress-access-buttons').addClass('show');
                  jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                  metapress_show_ajax_error(error.message);
              }).on('transactionHash', function(hash) {
                  jQuery('.metapress-access-buttons').addClass('show');
                  jQuery('.metapress-notice-box').html('<p>Please try again after your transaction '+hash+' is complete!</p>').show();
              });
            } else {
                  console.log('setting allowance');
                  await approval_contract.methods.approve(metapress_contract_address, wei_amount).send({from: this.currentMMAccount}).on('error', function(error, receipt) {
                      jQuery('.metapress-access-buttons').addClass('show');
                      jQuery('.metapress-notice-box').html('<p>'+error.message+'</p>').show();
                      metapress_show_ajax_error(error.message);
                  }).on('transactionHash', function(hash){
                      metapress_manager.metapress_create_new_metamask_transaction(product_id, token, token_price, hash, 'approval', contract_address);
                  });
              }
        } else {
            await metapress_manager.confirmContractPayment(product_id, token, token_price, contract_address, null);
        }
    }

    async confirmContractPayment(product_id, token, token_price, contract_address, transaction_id) {
        this.set_contract(this.mm_account_provider_name);
        if( metapress_metamask_loading_manager.currentMMAccount && this.metapress_contract && this.mm_account_provider_name ) {

            var wei_amount = this.metapress_web3.utils.toWei(token_price, 'ether');

            // DIRECT TRANSACTION VIA SMART CONTRACT ON NETWORK
            await this.metapress_contract.methods.smartTokenTransfer(contract_address, this.send_to_address, wei_amount).send({from: this.currentMMAccount}).on('transactionHash', (hash) => {
                if( transaction_id != null ) {
                    this.update_approval_metamask_transaction(product_id, hash, transaction_id);
                } else {
                    this.metapress_create_new_metamask_transaction(product_id, token, token_price, hash, 'pending', contract_address);
                }
            }).on('error', (error) => {
                metapress_show_ajax_error(error);
            });

        }
     }

     metapress_create_new_metamask_transaction(product_id, token, token_price, hash, status, contract_address) {
         if( product_id && this.currentMMAccount ) {
             metapress_show_ajax_updating('Creating transaction...');
             var metapress_manager = this;
             jQuery.ajax({
                 url: metapressmanagerrequests.ajaxurl,
                 type: 'POST',
                 data: {
                     'action': 'create_metapress_transaction_ajax_request',
                     'transaction_hash': hash,
                     'token': token,
                     'token_amount': token_price,
                     'network': this.mm_account_provider_name,
                     'product_id': product_id,
                     'spender_address': this.currentMMAccount,
                     'txn_status': status,
                     'contract_address': contract_address
                 },
                 success: function(response) {
                     jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                     var transaction_response = jQuery.parseJSON(response);
                     if( transaction_response && transaction_response.success ) {
                       var transaction_viewing_url = metapress_manager.metapress_transaction_viewing_url + 'tx/' + hash;
                       var pending_transaction_notice = '<p>Thank You! Your <a href="'+transaction_viewing_url+'" target="_blank">transaction is currently pending</a>. Please check again once your transaction is complete.</p>';
                       jQuery('.metapress-notice-box').html(pending_transaction_notice).show();
                     }
                 },
                 error: function(error) {
                     metapress_show_ajax_error(error.responseText);
                 }
             });
         }
     }

     update_approval_metamask_transaction(product_id, transaction_hash, transaction_id) {
         if( product_id && this.currentMMAccount ) {
             metapress_show_ajax_updating('Confirming transaction...');
             var metapress_manager = this;
             jQuery.ajax({
                 url: metapressmanagerrequests.ajaxurl,
                 type: 'POST',
                 data: {
                     'action': 'update_metapress_transaction_ajax_request',
                     'transaction_id': transaction_id,
                     'transaction_hash': transaction_hash,
                     'product_id': product_id,
                     'spender_address': this.currentMMAccount
                 },
                 success: function(response) {
                     jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                     var transaction_response = jQuery.parseJSON(response);
                     if( transaction_response && transaction_response.updated ) {
                       var transaction_viewing_url = metapress_manager.metapress_transaction_viewing_url + 'tx/' + transaction_hash;
                       var pending_transaction_notice = '<p>Thank You! Your <a href="'+transaction_viewing_url+'" target="_blank">transaction is currently pending</a>. Please check again once your transaction is complete.</p>';
                       jQuery('.metapress-notice-box').html(pending_transaction_notice).show();
                     }
                 },
                 error: function(error) {
                     metapress_show_ajax_error(error.responseText);
                 }
             });
         }
     }

     metapress_create_nft_access_token(product_id) {
         if( product_id && this.currentMMAccount ) {
             metapress_show_ajax_updating('Creating your access token...');
             var metapress_manager = this;
             jQuery.ajax({
                 url: metapressmanagerrequests.ajaxurl,
                 type: 'POST',
                 data: {
                     'action': 'metapress_create_nft_access_token_ajax_request',
                     'product_id': product_id,
                     'spender_address': this.currentMMAccount,
                     'nft_owner_verified': jQuery('#metapress-nft-verification-text').data('nonce'),
                     'mpredirect': jQuery('#metapress-nft-verification-text').data('redirect'),
                 },
                 success: function(response) {
                     jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                     var transaction_response = jQuery.parseJSON(response);
                     if( transaction_response && transaction_response.success && transaction_response.access_token ) {
                         if( transaction_response.redirect ) {
                             window.location.href = transaction_response.redirect;
                         } else {
                             metapress_metamask_loading_manager.metapress_set_token_param(transaction_response.access_token);
                         }
                     }
                 },
                 error: function(error) {
                     metapress_show_ajax_error(error.responseText);
                 }
             });
         }
     }

    metapress_set_token_param(token) {
        var metapress_url = new URL(window.location.href);
        metapress_url.searchParams.set('mpatok',token);
        window.location.href = metapress_url.href;
    }

    metapress_remove_token_param() {
        var metapress_url = new URL(window.location.href);
        metapress_url.searchParams.delete('mpatok');
        window.location.href = metapress_url.href;
    }
}
let metapress_metamask_loading_manager = new MetaPress_MetaMask_Loading_Manager();
if (typeof window.ropsten !== 'undefined' || typeof window.ethereum !== 'undefined') {
    metapress_metamask_loading_manager.metapressCheckEthereumProvider();
}
