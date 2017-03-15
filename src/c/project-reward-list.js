import m from 'mithril';
import _ from 'underscore';
import I18n from 'i18n-js';
import h from '../h';
import rewardVM from '../vms/reward-vm';
import projectVM from '../vms/project-vm';

const I18nScope = _.partial(h.i18nScope, 'projects.reward_list');

const projectRewardList = {
    controller(args) {
        const storeKey = 'selectedReward',
            vm = rewardVM;

        const setInput = (el, isInitialized) => !isInitialized ? el.focus() : false;

        const submitContribution = () => {
            const valueFloat = h.monetaryToFloat(vm.contributionValue);

            if (valueFloat < vm.selectedReward().minimum_value) {
                vm.error(`O valor de apoio para essa recompensa deve ser de no mínimo R$${vm.selectedReward().minimum_value}`);
            } else {
                vm.error('');
                h.navigateTo(`/projects/${projectVM.currentProject().project_id}/contributions/fallback_create?contribution%5Breward_id%5D=${vm.selectedReward().id}&contribution%5Bvalue%5D=${valueFloat}`);
            }

            return false;
        };

        const hasShippingOptions = reward => !_.isNull(reward.shipping_options) && !reward.shipping_options === 'free';

        if (h.getStoredObject(storeKey)) {
            const {
                value,
                reward
            } = h.getStoredObject(storeKey);

            h.removeStoredObject(storeKey);
            vm.selectedReward(reward);
            vm.contributionValue(h.applyMonetaryMask(`${value},00`));
            submitContribution();
        }

        return {
            applyMask: vm.applyMask,
            error: vm.error,
            submitContribution,
            hasShippingOptions,
            openedReward: vm.selectedReward,
            selectReward: vm.selectReward,
            contributionValue: vm.contributionValue,
            setInput
        };
    },
    view(ctrl, args) {
        // FIXME: MISSING ADJUSTS
        // - add draft admin modifications
        const project = args.project() || {
            open_for_contributions: false
        };
        return m('#rewards.u-marginbottom-30', _.map(args.rewardDetails(), reward => m(`div[class="${h.rewardSouldOut(reward) ? 'card-gone' : `card-reward ${project.open_for_contributions ? 'clickable' : ''}`} card card-secondary u-marginbottom-10"]`, {
            onclick: h.analytics.event({
                cat: 'contribution_create',
                act: 'contribution_reward_click',
                lbl: reward.minimum_value,
                project,
                extraData: {
                    reward_id: reward.id,
                    reward_value: reward.minimum_value
                }
            }, ctrl.selectReward(reward))
        }, [
            reward.minimum_value >= 100 ? m('.tag-circle-installment', [
                m('.fontsize-smallest.fontweight-semibold.lineheight-tightest', '3x'),
                m('.fontsize-mini.lineheight-tightest', 's/ juros')
            ]) : '',
            m('.u-marginbottom-20', [
                m('.fontsize-base.fontweight-semibold', `Para R$ ${h.formatNumber(reward.minimum_value)} ou mais`),
                m('.fontsize-smaller.fontweight-semibold', h.pluralize(reward.paid_count, ' apoio', ' apoios')), (reward.maximum_contributions > 0 ? [
                    (reward.waiting_payment_count > 0 ? m('.maximum_contributions.in_time_to_confirm.clearfix', [
                        m('.pending.fontsize-smallest.fontcolor-secondary', h.pluralize(reward.waiting_payment_count, ' apoio em prazo de confirmação', ' apoios em prazo de confirmação.'))
                    ]) : ''), (h.rewardSouldOut(reward) ? m('.u-margintop-10', [
                        m('span.badge.badge-gone.fontsize-smaller', 'Esgotada')
                    ]) : m('.u-margintop-10', [
                        m('span.badge.badge-attention.fontsize-smaller', [
                            m('span.fontweight-bold', 'Limitada'),
                            project.open_for_contributions ? ` (${h.rewardRemaning(reward)} de ${reward.maximum_contributions} disponíveis)` : ''
                        ])
                    ]))
                ] : ''),
            ]),

            m('.fontsize-smaller.u-margintop-20', m.trust(h.simpleFormat(h.strip(reward.description)))),
            m('.u-marginbottom-20.w-row', [
                m('.w-col.w-col-6', !_.isEmpty(reward.deliver_at) ? [
                    m('.fontcolor-secondary.fontsize-smallest',
                        m('span',
                            'Entrega prevista:'
                        )
                    ),
                    m('.fontsize-smallest',
                        h.momentify(reward.deliver_at, 'MMM/YYYY')
                    )
                ] : ''),
                m('.w-col.w-col-6', ctrl.hasShippingOptions(reward) ? [
                    m('.fontcolor-secondary.fontsize-smallest',
                        m('span',
                            'Forma de envio:'
                        )
                    ),
                    m('.fontsize-smallest',
                        I18n.t(`shipping_options.${reward.shipping_options}`, I18nScope())
                    )
                ] : '')
            ]),
            (project.open_for_contributions && !h.rewardSouldOut(reward) ? [
                ctrl.openedReward().id === reward.id ? m('.w-form', [
                    m('form.u-margintop-30', {
                        onsubmit: ctrl.submitContribution
                    }, [
                        m('.divider.u-marginbottom-20'),
                        ctrl.hasShippingOptions(reward) ? m('div',
                                [
                                    m('.fontcolor-secondary.u-marginbottom-10',
                                        'Local de entrega'
                                    ),
                                    m('select.positive.text-field.w-select',
                                        [
                                            m('option[value="national"]',
                                                'Somente Brasil'
                                            ),
                                            m('option[value="international"]',
                                                'Qualquer Lugar do Mundo'
                                            )
                                        ]
                                    )
                                ]
                            ) : '',
                        m('.fontcolor-secondary.u-marginbottom-10',
                            'Valor do apoio'
                        ),
                        m('.w-row.u-marginbottom-20', [
                            m('.w-col.w-col-3.w-col-small-3.w-col-tiny-3',
                                m('.back-reward-input-reward.placeholder',
                                    'R$'
                                )
                            ),
                            m('.w-col.w-col-9.w-col-small-9.w-col-tiny-9',
                                m('input.w-input.back-reward-input-reward[type="tel"]', {
                                    config: ctrl.setInput,
                                    onkeyup: m.withAttr('value', ctrl.applyMask),
                                    value: ctrl.contributionValue()
                                })
                            )
                        ]),
                        m('input.w-button.btn.btn-medium[type="submit"][value="Continuar >"]'),
                        ctrl.error().length > 0 ? m('.text-error', [
                            m('br'),
                            m('span.fa.fa-exclamation-triangle'),
                            ` ${ctrl.error()}`
                        ]) : ''
                    ])
                ]) : '',
            ] : '')
        ])));
    }
};

export default projectRewardList;
