/**
 * 이 파일은 아이모듈 FAQ모듈의 일부입니다. (https://www.imodules.io)
 *
 * 관리자 UI 이벤트를 관리하는 클래스를 정의한다.
 *
 * @file /modules/faq/admin/scripts/Faq.ts
 * @author Arzz <arzz@arzz.com>
 * @license MIT License
 * @modified 2024. 5. 11.
 */
namespace modules {
    export namespace faq {
        export namespace admin {
            export class Faq extends modules.admin.admin.Component {
                faqs = {
                    /**
                     * FAQ를 추가한다.
                     *
                     * @type {string} faq_id - FAQ고유값
                     */
                    add: (faq_id: string = null): void => {},
                    /**
                     * FAQ를 삭제한다.
                     *
                     * @type {string} faq_id - 삭제할 FAQ고유값
                     */
                    delete: (faq_id: string): void => {},
                };

                categories = {
                    /**
                     * FAQ분류를 추가한다.
                     *
                     * @type {string} category_id - 분류고유값
                     */
                    add: (category_id: string = null): void => {},
                    /**
                     * FAQ분류를 삭제한다.
                     *
                     * @type {string} category_id - 삭제할 분류고유값
                     */
                    delete: (category_id: string): void => {},
                };

                documents = {
                    /**
                     * FAQ문서를 추가한다.
                     *
                     * @type {string} document_id - 문서고유값
                     */
                    add: (document_id: string = null): void => {},
                    /**
                     * FAQ문서를 삭제한다.
                     */
                    delete: () => void {},
                };
            }
        }
    }
}
