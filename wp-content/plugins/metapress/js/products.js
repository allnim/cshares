class MetaPress_Product_Payments_Manager {
    constructor() {
      if( metapress_metamask_loading_manager.mm_account_provider_name == 'matictestnet' || metapress_metamask_loading_manager.mm_account_provider_name == 'maticmainnet' ) {
          this.payment_token = 'MATIC';
      }
      if( metapress_metamask_loading_manager.mm_account_provider_name == 'ropsten' || metapress_metamask_loading_manager.mm_account_provider_name == 'mainnet' ) {
          this.payment_token = 'ETH';
      }
    }

    async get_token_ratio(token) {
        let token_pair = token+metapressjsdata.fiat_currency; // default to USD
        if( token == 'MATIC' || token == 'ETH' ) {
            token_pair = token+'USDT';
        }
        let mp_current_timestamp = (Date.now() - 30000) / 1000;
        mp_current_timestamp = parseInt(mp_current_timestamp);
        if( metapressjsdata.token_ratios && metapressjsdata.token_ratios[token_pair] ) {
            if( metapressjsdata.tokens_updated && (metapressjsdata.tokens_updated > mp_current_timestamp) ) {
                return metapressjsdata.token_ratios[token_pair];
            }
        }
        return 0;
    }

    confirm_correct_network(token, network) {
        if(token == 'MATIC') {
            if( metapress_metamask_loading_manager.mm_account_provider_name == 'matictestnet' || metapress_metamask_loading_manager.mm_account_provider_name == 'maticmainnet' ) {
                this.payment_token = token;
                return true;
            } else {
              var incorrect_network_message = '<p>Please switch to the Polygon (Matic) network.<br><a href="https://docs.matic.network/docs/develop/metamask/config-matic/" target="_blank">'+metapressjsdata.how_to_add_text+'</a></p>';
              jQuery('.metapress-notice-box').html(incorrect_network_message).show();
              return false;
            }
        }

        if(token == 'ETH') {
            if( metapress_metamask_loading_manager.mm_account_provider_name == 'ropsten' || metapress_metamask_loading_manager.mm_account_provider_name == 'mainnet' ) {
                this.payment_token = token;
                return true;
            } else {
                var incorrect_network_message = '<p>Please switch to the Ethereum Mainnet network</p>';
                jQuery('.metapress-notice-box').html(incorrect_network_message).show();
                return false;
            }
        }

        if( network != metapress_metamask_loading_manager.mm_account_provider_name ) {
            var incorrect_network_message = '<p>Incorrect Network. Please change to the '+network+' network.</p>';
            jQuery('.metapress-notice-box').html(incorrect_network_message).show();
            return false;
        } else {
            this.payment_token = token;
            return true;
        }
    }

    verify_product_price(product_id, access_box, token_address) {
        jQuery('.metapress-notice-box').html('').hide();
        jQuery('.metapress-access-buttons').removeClass('show');
        if( product_id && metapress_metamask_loading_manager.currentMMAccount ) {
            metapress_show_ajax_updating('Requesting access...');
            let metapress_product_data = this;
            jQuery.ajax({
                url: metapressmanagerrequests.ajaxurl,
                type: 'GET',
                data: {
                    'action': 'verify_metapress_product_price_ajax_request',
                    'product_id': product_id,
                    'spender_address': metapress_metamask_loading_manager.currentMMAccount,
                },
                success: function(response) {
                    jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                    var product_response = jQuery.parseJSON(response);
                    if( product_response ) {
                        if( product_response.has_access && product_response.access_token ) {
                            metapress_metamask_loading_manager.metapress_set_token_param(product_response.access_token);
                        } else if( product_response.transaction_hash ) {
                            metapress_product_data.check_transaction_hash_receipt(product_id, access_box, product_response);
                        } else {
                            metapress_metamask_loading_manager.makeContractPayment(product_id, product_response.price, metapress_product_data.payment_token, token_address);
                        }
                    } else {
                      jQuery('.metapress-access-buttons').addClass('show');
                    }
                },
                error: function(error) {
                    metapress_show_ajax_error(error.responseText);
                    jQuery('.metapress-access-buttons').addClass('show');
                }
            });
        }
    }

    check_current_address_access(product_id, access_box) {
        if( product_id && metapress_metamask_loading_manager.currentMMAccount ) {
            metapress_show_ajax_updating('Checking access...');
            let metapress_product_data = this;
            jQuery.ajax({
                url: metapressmanagerrequests.ajaxurl,
                type: 'GET',
                data: {
                    'action': 'verify_metapress_product_price_ajax_request',
                    'product_id': product_id,
                    'spender_address': metapress_metamask_loading_manager.currentMMAccount,
                },
                success: function(response) {
                    jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                    var product_response = jQuery.parseJSON(response);
                    if( product_response ) {
                        if( product_response.has_access && product_response.access_token ) {
                            metapress_metamask_loading_manager.metapress_set_token_param(product_response.access_token);
                        } else {
                            if( product_response.transaction_hash ) {
                                metapress_product_data.check_transaction_hash_receipt(product_id, access_box, product_response);
                            }
                            if( product_response.price ) {
                                metapress_product_data.set_token_price_labels(product_response.price);

                            }
                        }
                    }
                },
                error: function(error) {
                    metapress_show_ajax_error(error.responseText);
                    jQuery('.metapress-access-buttons').addClass('show');
                }
            });
        }
    }

    set_token_price_labels(price) {
        const metapress_product_manager = this;
        jQuery('.metapress-payment-button').each( function() {
            let payment_button = jQuery(this);
            let token = payment_button.data('token');
            let token_address = payment_button.data('address');
            let token_network = payment_button.data('network');
            let token_amount_label = payment_button.find('.metapress-payment-button-amount');
            metapress_product_manager.get_token_ratio(token).then((ratio) => {
              if( ratio > 0 ) {
                  let token_price = (price * ratio);
                  token_price = token_price.toFixed(6).toString();
                  payment_button.find('.metapress-payment-button-amount').html(token_price+' '+token);
              } else {
                  if( token == 'ETH' || token == 'MATIC' ) {
                      metapress_token_ratio_manager.get_binance_token_ratio(token).then((ratio) => {
                          let token_price = (price * ratio);
                          token_price = token_price.toFixed(6).toString();
                          payment_button.find('.metapress-payment-button-amount').html(token_price+' '+token);
                      });
                  } else {
                      metapress_token_ratio_manager.get_coingecko_token(token_network, token_address, token).then((ratio) => {
                          let token_price = (price * ratio);
                          token_price = token_price.toFixed(6).toString();
                          payment_button.find('.metapress-payment-button-amount').html(token_price+' '+token);
                      });
                  }
              }
            });
        });
    }

    check_current_address_products_access(products) {
        if( products && jQuery.isArray(products) && metapress_metamask_loading_manager.currentMMAccount ) {
            let metapress_product_data = this;
            jQuery.ajax({
                url: metapressmanagerrequests.ajaxurl,
                type: 'GET',
                data: {
                    'action': 'metapress_check_products_access_single_ajax_request',
                    'products': products,
                    'spender_address': metapress_metamask_loading_manager.currentMMAccount,
                },
                success: function(response) {
                    jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                    var product_response = jQuery.parseJSON(response);
                    if( product_response ) {
                        if( product_response.has_access && product_response.access_token ) {
                            metapress_metamask_loading_manager.metapress_set_token_param(product_response.access_token);
                        } else {
                            if( product_response.transaction_hash ) {
                                let access_box = jQuery('#metapress-single-restricted-content');
                                metapress_product_data.check_transaction_hash_receipt(product_response.product_id, access_box, product_response);
                            }
                        }
                    }
                },
                error: function(error) {
                    metapress_show_ajax_error(error.responseText);
                    jQuery('.metapress-access-buttons').addClass('show');
                }
            });
        }
    }

    check_transaction_hash_receipt(product_id, access_box, transaction) {
        let metapress_box_buttons = access_box.find('.metapress-access-buttons');
        let metapress_notice_box = access_box.find('.metapress-notice-box');
        metapress_show_ajax_updating('Checking transaction status...');
        metapress_metamask_loading_manager.metapress_web3.eth.getTransactionReceipt(transaction.transaction_hash, (err, txReceipt) => {
            jQuery('#metapress-updating-box').removeClass('show-overlay-box');
            if( err ) {
                let metapress_notice_box = access_box.find('.metapress-notice-box');
                metapress_notice_box.html('Error: '+err).show();
            }
            if( txReceipt && txReceipt.status === true ) {
                if( transaction.transaction_status == 'pending' ) {
                    this.mark_transaction_as_paid(product_id, transaction.transaction_hash);
                }

                if( transaction.transaction_status == 'approval' ) {

                    metapress_box_buttons.removeClass('show');
                    let transaction_amount = transaction.sent_amount.substring(0,8);

                    let transaction_viewing_url = metapress_metamask_loading_manager.metapress_transaction_viewing_url + 'tx/' + transaction.transaction_hash;
                    let pending_transaction_notice = '<p>Your spend approval for '+transaction_amount+' '+transaction.token+' is complete!</p>';
                    pending_transaction_notice += '<span class="metapress-confirm-transaction" data-transaction="'+transaction.id+'" data-product-id="'+product_id+'" data-amount="'+transaction.sent_amount+'" data-token="'+transaction.token+'" data-contract-address="'+transaction.contract_address+'">Confirm Payment</span>';
                    metapress_notice_box.html(pending_transaction_notice).show();
                }

            } else {
                metapress_box_buttons.removeClass('show');
                let transaction_viewing_url = metapress_metamask_loading_manager.metapress_transaction_viewing_url + 'tx/' + transaction.transaction_hash;
                let pending_transaction_notice = '<p>You have a <a href="'+transaction_viewing_url+'" target="_blank">pending transaction</a>! Please check again once your transaction is complete.</p><span class="metapress-remove-transaction" data-transaction="'+transaction.transaction_hash+'" data-product-id="'+product_id+'">I need to make a new transaction</span>';
                metapress_notice_box.html(pending_transaction_notice).show();
            }
      });
    }

    mark_transaction_as_paid(product_id, hash) {
        if( product_id && metapress_metamask_loading_manager.currentMMAccount ) {
            metapress_show_ajax_updating('Confirming transaction...');
            jQuery.ajax({
                url: metapressmanagerrequests.ajaxurl,
                type: 'POST',
                data: {
                    'action': 'metapress_mark_transaction_as_paid_ajax_request',
                    'transaction_hash': hash,
                    'product_id': product_id,
                    'spender_address': metapress_metamask_loading_manager.currentMMAccount,
                },
                success: function(response) {
                    jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                    var transaction_response = jQuery.parseJSON(response);
                    if( transaction_response && transaction_response.success && transaction_response.access_token ) {
                        metapress_metamask_loading_manager.metapress_set_token_param(transaction_response.access_token);
                    }
                },
                error: function(error) {
                    metapress_show_ajax_error(error.responseText);
                }
            });
        }
    }

    remove_pending_transaction(product_id, transaction_hash) {
        jQuery('.metapress-notice-box').hide();
        if( product_id && metapress_metamask_loading_manager.currentMMAccount ) {
            metapress_show_ajax_updating('removing transaction...');
            jQuery.ajax({
                url: metapressmanagerrequests.ajaxurl,
                type: 'POST',
                data: {
                    'action': 'metapress_remove_pending_transaction_ajax_request',
                    'product_id': product_id,
                    'transaction_hash': transaction_hash,
                    'spender_address': metapress_metamask_loading_manager.currentMMAccount,
                },
                success: function(response) {
                    jQuery('#metapress-updating-box').removeClass('show-overlay-box');
                    var transaction_response = jQuery.parseJSON(response);
                    if( transaction_response && transaction_response.success ) {
                        window.location.reload();
                    } else {
                      jQuery('.metapress-notice-box').show();
                    }
                },
                error: function(error) {
                    metapress_show_ajax_error(error.responseText);
                    jQuery('.metapress-access-buttons').addClass('show');
                }
            });
        }
    }
}

jQuery(document).ready( function() {
    metapress_metamask_loading_manager.metapressGetUserMetaMaskAccount().then( function() {
        if( metapress_metamask_loading_manager.currentMMAccount ) {

            const metapress_product_payments_manager = new MetaPress_Product_Payments_Manager();

            if( jQuery('.metapress-restricted-access').length > 0 ) {
                if( jQuery('#metapress-single-restricted-content').length > 0 ) {
                    let page_product_list = jQuery('#metapress-single-restricted-content').data('product-ids').toString();
                    if( page_product_list.indexOf(',') === -1 ) {
                        page_product_list = [page_product_list];
                    } else {
                        page_product_list = page_product_list.split(',');
                    }

                    metapress_product_payments_manager.check_current_address_products_access(page_product_list);
                } else {
                    metapress_product_payments_manager.check_current_address_access(jQuery('.metapress-restricted-access').data('product-id'), jQuery('.metapress-restricted-access'));
                }
            }

            if( jQuery('.metapress-checkout-access').length > 0 ) {
                metapress_product_payments_manager.check_current_address_access(jQuery('.metapress-checkout-access').data('product-id'), jQuery('.metapress-checkout-access'));
            }

            jQuery('.metapress-payment-button').click( function() {
                let pay_with_token = jQuery(this).data('token');
                let pay_network = jQuery(this).data('network');
                let token_address = jQuery(this).data('address');
                let token_ratio_address = token_address;
                if( jQuery(this).hasClass('test-token') ) {
                    token_address = jQuery(this).data('test-address');
                }
                let product_id = jQuery(this).data('product-id');
                let access_box = jQuery(this).parents('.metapress-restricted-access');

                let is_correct_network = metapress_product_payments_manager.confirm_correct_network(pay_with_token, pay_network);
                if( is_correct_network ) {

                    metapress_product_payments_manager.get_token_ratio(this.payment_token).then((ratio) => {
                      if( ratio > 0 ) {
                          metapress_metamask_loading_manager.token_ratio = ratio;
                          metapress_product_payments_manager.verify_product_price(product_id, access_box, token_address);
                      } else {
                          if( pay_with_token == 'ETH' || pay_with_token == 'MATIC' ) {
                              metapress_token_ratio_manager.get_binance_token_ratio(pay_with_token).then((ratio) => {
                                  metapress_metamask_loading_manager.token_ratio = ratio;
                                  metapress_product_payments_manager.verify_product_price(product_id, access_box, token_address);
                              });
                          } else {
                              metapress_token_ratio_manager.get_coingecko_token(pay_network, token_ratio_address, pay_with_token).then((ratio) => {
                                  metapress_metamask_loading_manager.token_ratio = ratio;
                                  metapress_product_payments_manager.verify_product_price(product_id, access_box, token_address);
                              });
                          }

                      }
                    });
                }
            });

            jQuery('body').delegate('.metapress-remove-transaction', 'click', function() {
                if( window.confirm('Are you sure you want to create a new transaction? This will delete any pending transactions for access to this content.') ) {
                    metapress_product_payments_manager.remove_pending_transaction(jQuery(this).data('product-id'), jQuery(this).data('transaction'));
                }
            });

            jQuery('body').delegate('.metapress-confirm-transaction', 'click', function() {
                let transaction_id = jQuery(this).data('transaction');
                let approval_amount = jQuery(this).data('amount').toString();
                let contract_address = jQuery(this).data('contract-address');
                let product_id = jQuery(this).data('product-id');
                metapress_metamask_loading_manager.confirmContractPayment(product_id, null, approval_amount, contract_address, transaction_id);
            });

            // NEW NFT VERIFICATION

            jQuery('body').delegate('.metapress-verify-button', 'click', function() {
                let nft_token_data = jQuery(this).parents('.metapress-verify-nft-owner');
                let product_id = nft_token_data.data('product-id');
                let token_id = nft_token_data.data('token');
                let token_type = nft_token_data.data('token-type');
                let contract_address = nft_token_data.data('contract-address');
                let contract_network = nft_token_data.data('network');

                let is_correct_network = metapress_product_payments_manager.confirm_correct_network(null, contract_network);
                if( is_correct_network ) {
                    if( token_type == 'erc20' ) {
                        metapress_metamask_loading_manager.verify_erc20_owner(contract_address, product_id);
                    }
                    if( token_type == 'erc721' ) {
                        if( token_id && token_id != "" ) {
                            metapress_metamask_loading_manager.verify_721_nft_owner(token_id, contract_address, product_id);
                        } else {
                            metapress_metamask_loading_manager.verify_721_nft_collection_owner(contract_address, product_id);
                        }

                    }
                    if( token_type == 'erc1155' ) {
                        metapress_metamask_loading_manager.verify_1155_nft_owner(token_id, contract_address, product_id);
                    }
                }

            });



        }
    });
});
