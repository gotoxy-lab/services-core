import m from 'mithril';
import _ from 'underscore';
import I18n from 'i18n-js';
import h from '../h';
import moment from 'moment';
import models from '../models';
import {catarse} from '../api';
import contributionVM from '../vms/contribution-vm';
import ownerMessageContent from '../c/owner-message-content';
import modalBox from '../c/modal-box';
import userVM from '../vms/user-vm';

const I18nScope = _.partial(h.i18nScope, 'payment.state');
const contributionScope = _.partial(h.i18nScope, 'users.contribution_row');

const userSubscriptionBox = {
    controller(args) {
        const subscription=args.subscription,
            displayModal = h.toggleProp(false, true),
            contactModalInfo = m.prop({});

        const filterProjVM = catarse.filtersVM({
                project_id: 'eq'
            }).project_id(subscription.project_external_id),
            lProj = catarse.loaderWithToken(models.project.getRowOptions(filterProjVM.parameters()));
        
        lProj.load().then(function(arr){
            subscription.project = arr[0];
            contactModalInfo({
                id: subscription.project.project_user_id,
                name: subscription.project.owner_name,
                project_id: subscription.project.project_id
            });
            // console.log('subscription1:', JSON.stringify(subscription, null, 2));
        });

        if (subscription.reward_external_id) {
            const filterRewVM = catarse.filtersVM({
                    id: 'eq'
                }).id(subscription.reward_external_id),
                lRew = catarse.loaderWithToken(models.rewardDetail.getRowOptions(filterRewVM.parameters()));

            lRew.load().then(function(arr) {
                subscription.reward = arr[0];
                // console.log('subscription2:', JSON.stringify(subscription, null, 2));
            });
        }

        return {
            toggleAnonymous: userVM.toggleAnonymous,
            displayModal,
            subscription,
            contactModalInfo
        };
    },
    view(ctrl) {
        const subscription = ctrl.subscription;

        return (!_.isEmpty(subscription) && !_.isEmpty(subscription.project) ? m('div',
            (ctrl.displayModal() && !_.isEmpty(ctrl.contactModalInfo())
                ? m.component(modalBox, {
                    displayModal: ctrl.displayModal,
                    content: [ownerMessageContent, ctrl.contactModalInfo]
                }) : ''
            ), [
                m('.card.w-row', [
                    m('.u-marginbottom-20.w-col.w-col-3', [
                        m('.u-marginbottom-10.w-row', [
                            m('.u-marginbottom-10.w-col.w-col-4',
                                m(`a.w-inline-block[href='/${subscription.project.permalink}']`,
                                    m(`img.thumb-project.u-radius[alt='${subscription.project.project_name}'][src='${subscription.project.project_img}'][width='50']`)
                                )
                            ),
                            m('.w-col.w-col-8',
                                m('.fontsize-small.fontweight-semibold.lineheight-tight',
                                    [
                                        m(`a.link-hidden[href='/${subscription.project.permalink}']`,
                                            subscription.project.project_name
                                        ),
                                        m('img[alt="Badge Assinatura"][src="/assets/catarse_bootstrap/badge-sub-h.png"]')                                    
                                    ]
                                )
                            )
                        ]),
                        m("a.btn.btn-edit.btn-inline.btn-small.w-button[href='javascript:void(0);']", {
                            onclick: () => {
                                ctrl.displayModal.toggle();
                            }
                        },
                            I18n.t('contact_author', contributionScope())
                        )
                    ]),
                    m('.u-marginbottom-20.w-col.w-col-3', [
                        m('.fontsize-base.fontweight-semibold.lineheight-looser',
                            `R$ ${h.formatNumber(parseFloat((subscription.checkout_data||subscription).amount) / 100)} por mês`
                        ),
                        m('.fontcolor-secondary.fontsize-smaller.fontweight-semibold',
                            `Assinante há ${moment(subscription.created_at).locale('pt').fromNow(true)}`
                        ),
                        m('.w-embed',
                            m('div', [
                                m('.w-hidden-main.w-hidden-medium.fontsize-smallest.fontweight-semibold',
                                    I18n.t('status', contributionScope())
                                ),
                                m('.fontsize-smallest',
                                    ( (subscription.checkout_data&&subscription.checkout_data.payment_method) === 'BoletoBancario' ? 'Boleto Bancário' : 'Cartão de Crédito')
                                ),
                                (contributionVM.canShowReceipt(subscription) ?
                                    m(`a.alt-link.u-margintop-10[href='/projects/${subscription.project.id}/contributions/${subscription.contribution_id}/receipt'][target='__blank']`,
                                        I18n.t('show_receipt', contributionScope())
                                    ) : ''),

                                (subscription.gateway_data && contributionVM.canShowSlip(subscription) ?
                                    m(`a.alt-link.u-margintop-10[href='${subscription.gateway_data.boleto_url}'][target='__blank']`,
                                        I18n.t('print_slip', contributionScope())
                                    ) : ''),

                                (subscription.gateway_data && contributionVM.canGenerateSlip(subscription) ?
                                    m(`a.alt-link.u-margintop-10[href='/projects/${subscription.project.id}/contributions/${subscription.contribution_id}/second_slip'][target='__blank']`,
                                        I18n.t('slip_copy', contributionScope())
                                    ) : '')
                            ])
                        )
                    ]),
                    m('.u-marginbottom-20.w-col.w-col-3', [
                        (subscription.reward ? [m('.fontsize-smallest.fontweight-semibold',
                            subscription.reward.title
                        ), m('p.fontcolor-secondary.fontsize-smallest', m.trust(h.simpleFormat(
                            `${subscription.reward.description.substring(0, 90)} (...)`
                        )))] : (subscription.reward_external_id ? null : ` ${I18n.t('no_reward', contributionScope())} `))
                    ]),
                    m('.u-marginbottom-10.u-text-center.w-col.w-col-3',
                        (subscription.status === 'started' ? [
                            m('.card-alert.fontsize-smaller.fontweight-semibold.u-marginbottom-10.u-radius', [
                                m('span.fa.fa-exclamation-triangle'),
                                m.trust('&nbsp;'),
                                'Aguardando confirmação do pagamento'
                            ])
                        ] :
                        (subscription.status === 'inactive' ? [
                            m('.card-alert.fontsize-smaller.fontweight-semibold.u-marginbottom-10.u-radius', [
                                m('span.fa.fa-exclamation-triangle'),
                                m.trust('&nbsp;'),
                                'Sua assinatura está suspensa por falta de pagamento'
                            ]),
                            m(`a.btn.btn-inline.btn-small.w-button[target=_blank][href=/projects/${subscription.project_external_id}/subscriptions/start${subscription.reward_external_id?'?reward_id='+subscription.reward_external_id:''}]`, 'Assinar novamente')
                        ] : subscription.status === 'canceled' ? [
                            m('.card-error.fontsize-smaller.fontweight-semibold.u-marginbottom-10.u-radius', [
                                m('span.fa.fa-exclamation-triangle'),
                                m.trust('&nbsp;'),
                                ' Você cancelou sua assinatura'
                            ])
                        ] : null))
                    )
                ])
            ]
        ) : m('div', '')
        );
    }
};

export default userSubscriptionBox;
