<?php
/**
 * 이 파일은 아이모듈 FAQ모듈의 일부입니다. (https://www.imodules.io)
 *
 * FAQ모듈 클래스를 정의한다.
 *
 * @file /modules/faq/Faq.php
 * @author Arzz <arzz@arzz.com>
 * @license MIT License
 * @modified 2024. 5. 11.
 */
namespace modules\faq;
class Faq extends \Module
{
    /**
     * @var \modules\faq\dtos\Faq[] $_faqs FAQ 정보를 저장한다.
     */
    private static array $_faqs = [];

    /**
     * @var \modules\faq\dtos\Category[] $_categories 카테고리 정보를 저장한다.
     */
    private static array $_categories = [];

    /**
     * 모듈의 컨텍스트 목록을 가져온다.
     *
     * @return array $contexts 컨텍스트목록
     */
    public function getContexts(): array
    {
        $contexts = [];
        $faqs = $this->db()
            ->select(['faq_id', 'title'])
            ->from($this->table('faqs'))
            ->orderBy('title', 'ASC')
            ->get();
        foreach ($faqs as $faq) {
            $contexts[] = ['name' => $faq->faq_id, 'title' => $faq->title . '(' . $faq->faq_id . ')'];
        }
        return $contexts;
    }

    /**
     * 모듈의 컨텍스트 설정필드를 가져온다.
     *
     * @return array $context 컨텍스트명
     * @return array $fields 설정필드목록
     */
    public function getContextConfigsFields(string $context): array
    {
        $fields = [];

        $options = [
            '#' => $this->getText('contexts.category'),
        ];
        foreach ($this->getFaq($context)->getCategories() as $option) {
            $options[$option->getId()] = $option->getTitle();
        }
        $category = [
            'name' => 'category',
            'label' => $this->getText('category'),
            'type' => 'select',
            'options' => $options,
            'value' => '#',
        ];
        $fields[] = $category;

        $template = [
            'name' => 'template',
            'label' => $this->getText('template'),
            'type' => 'template',
            'component' => [
                'type' => 'module',
                'name' => $this->getName(),
                'use_default' => true,
            ],
            'value' => '#',
        ];
        $fields[] = $template;

        return $fields;
    }

    /**
     * 모듈 컨텍스트의 콘텐츠를 가져온다.
     *
     * @param string $faq_id FAQ고유값
     * @param ?object $configs 컨텍스트 설정
     * @return string $html
     */
    public function getContext(string $faq_id, ?object $configs = null): string
    {
        $faq = $this->getFaq($faq_id);
        if ($faq === null) {
            return \ErrorHandler::get($this->error('NOT_FOUND_MANUAL', $faq_id));
        }

        /**
         * 컨텍스트 템플릿을 설정한다.
         */
        if (isset($configs?->template) == true && $configs->template->name !== '#') {
            $this->setTemplate($configs->template);
        } else {
            $this->setTemplate($faq->getTemplateConfigs());
        }

        $category_id ??= $this->getRouteAt(0) ?? ($configs?->category ?? '#');

        if ($category_id == '#') {
            $content = $this->getCategoryContext($faq_id);
        } else {
            $content = $this->getFaqContext($faq_id, $category_id);
        }

        return $this->getTemplate()->getLayout($content);
    }

    /**
     * FAQ 분류를 선택하는 컨텍스트를 가져온다.
     *
     * @param string $faq_id FAQ고유값
     * @return string $html
     */
    public function getCategoryContext(string $faq_id): string
    {
        $faq = $this->getFaq($faq_id);
        $categories = $faq->getCategories();

        $template = $this->getTemplate();
        $template->assign('faq', $faq);
        $template->assign('categories', $categories);

        return $template->getContext('category');
    }

    /**
     * FAQ 컨텍스트를 가져온다.
     *
     * @param string $faq_id FAQ고유값
     * @param ?object $category_id 카테고리고유값
     * @return string $html
     */
    public function getFaqContext(string $faq_id, ?string $category_id = null): string
    {
        $faq = $this->getFaq($faq_id);

        $categories = $faq->getCategories();
        $category_id ??= $this->getRouteAt(0) ?? null;
        if ($category_id === null) {
            if (count($categories) == 0) {
                return \ErrorHandler::get($this->error('NOT_FOUND_MANUAL', $faq_id));
            }

            $category_id = $categories[0]->getId();
        }

        $category = $this->getCategory($faq_id, $category_id);
        if ($category === null) {
            return \ErrorHandler::get($this->error('NOT_FOUND_CATEGORY', $faq_id));
        }

        $contents = $category->getContents();
        $content_id = $this->getRouteAt(1) ?? null;
        if ($content_id === null) {
            foreach ($contents as $content) {
                if ($content->isVisible($category->getLatestVersion()) == true) {
                    $content_id = $content->getId();
                    break;
                }
            }
        }

        $content = $content_id !== null ? $category->getContent($content_id) : null;
        if ($content === null) {
            return \ErrorHandler::get($this->error('NOT_FOUND_CONTENT', $faq_id));
        }

        $versions = $category->getVersions();
        $version = -1;
        if ($category->hasVersion() == true) {
            $version = $this->getRouteAt(2)
                ? $this->getVersionToInt($this->getRouteAt(2))
                : $category->getLatestVersion();
        }

        if (in_array($version, $versions) == false) {
            return \ErrorHandler::get($this->error('NOT_FOUND_VERSION', $faq_id));
        }

        $document = $content->getDocument($version);

        $template = $this->getTemplate();
        $template->assign('faq', $faq);
        $template->assign('category', $category);
        $template->assign('content', $content);
        $template->assign('version', $version);
        $template->assign('document', $document);

        return $template->getContext('faq');
    }

    /**
     * FAQ 정보를 가져온다.
     *
     * @param string $faq_id FAQ고유값
     * @return \modules\faq\dtos\Faq $faq FAQ정보
     */
    public function getFaq(string $faq_id): \modules\faq\dtos\Faq
    {
        if (isset(self::$_faqs[$faq_id]) == true) {
            return self::$_faqs[$faq_id];
        }

        $faq = $this->db()
            ->select()
            ->from($this->table('faqs'))
            ->where('faq_id', $faq_id)
            ->getOne();
        if ($faq === null) {
            \ErrorHandler::print($this->error('NOT_FOUND_BOARD', $faq_id));
        }

        self::$_faqs[$faq_id] = new \modules\faq\dtos\Faq($faq, $this);
        return self::$_faqs[$faq_id];
    }

    /**
     * 카테고리 정보를 가져온다.
     *
     * @param string $faq_id FAQ고유값
     * @param string $category_id 카테고리고유값
     * @return ?\modules\faq\dtos\Category $category 카테고리정보
     */
    public function getCategory(string $faq_id, string $category_id): ?\modules\faq\dtos\Category
    {
        if (isset(self::$_categories[$faq_id . '@' . $category_id]) == true) {
            return self::$_categories[$faq_id . '@' . $category_id];
        }

        if (isset($category) == false) {
            $category = $this->db()
                ->select()
                ->from($this->table('categories'))
                ->where('faq_id', $faq_id)
                ->where('category_id', $category_id)
                ->getOne();
        }

        if ($category === null) {
            self::$_categories[$faq_id . '@' . $category_id] = null;
        } else {
            self::$_categories[$faq_id . '@' . $category_id] = new \modules\faq\dtos\Category($category);
        }

        return self::$_categories[$faq_id . '@' . $category_id];
    }

    /**
     * 버전을 숫자로 변환하여 가져온다.
     *
     * @param string $version 버전
     * @return int $version 버전
     */
    public function getVersionToInt(string $version): int
    {
        if (preg_match('/^([0-9]+)\.([0-9]{1,3})$/', $version, $match) == true) {
            return $match[1] * 1000 + $match[2];
        } else {
            return 0;
        }
    }

    /**
     * 버전을 숫자로 변환하여 가져온다.
     *
     * @param string $version 버전
     * @return int $version 버전
     */
    public function getIntToVersion(int $version): string
    {
        if ($version < 1000) {
            return '0.0';
        }

        return floor($version / 1000) . '.' . $version % 1000;
    }

    /**
     * 특수한 에러코드의 경우 에러데이터를 현재 클래스에서 처리하여 에러클래스로 전달한다.
     *
     * @param string $code 에러코드
     * @param ?string $message 에러메시지
     * @param ?object $details 에러와 관련된 추가정보
     * @return \ErrorData $error
     */
    public function error(string $code, ?string $message = null, ?object $details = null): \ErrorData
    {
        switch ($code) {
            /**
             * FAQ이 존재하지 않는 경우
             */
            case 'NOT_FOUND_MANUAL':
                $error = \ErrorHandler::data($code, $this);
                $error->message = $this->getErrorText('NOT_FOUND_MANUAL', ['faq_id' => $message]);
                return $error;

            /**
             * URL 경로가 존재하지 않는 경우
             */
            case 'NOT_FOUND_CONTEXT':
                $error = \ErrorHandler::data($code, $this);
                $error->message = $this->getErrorText('NOT_FOUND_CONTEXT');
                $error->suffix = $message;
                return $error;

            /**
             * 권한이 부족한 경우, 로그인이 되어 있지 않을 경우, 로그인관련 에러메시지를 표시하고
             * 그렇지 않은 경우 권한이 부족하다는 에러메시지를 표시한다.
             */
            case 'FORBIDDEN':
                $error = \ErrorHandler::data($code, $this);
                /**
                 * @var ModuleMember $mMember
                 */
                $mMember = \Modules::get('member');
                if ($mMember->isLogged() == true) {
                    $error->prefix = $this->getErrorText('FORBIDDEN');
                    $error->message = $this->getErrorText('FORBIDDEN_DETAIL', [
                        'code' => $this->getErrorText('FORBIDDEN_CODE/' . $message),
                    ]);
                } else {
                    $error->prefix = $this->getErrorText('REQUIRED_LOGIN');
                }
                return $error;

            default:
                return parent::error($code, $message, $details);
        }
    }
}
