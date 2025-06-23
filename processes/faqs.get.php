<?php
/**
 * 이 파일은 아이모듈 FAQ모듈의 일부입니다. (https://www.imodules.io)
 *
 * FAQ 목록을 가져온다.
 *
 * @file /modules/faq/processes/faqs.get.php
 * @author Arzz <arzz@arzz.com>
 * @license MIT License
 * @modified 2024. 5. 11.
 *
 * @var \modules\manual\Faq $me
 */
if (defined('__IM_PROCESS__') == false) {
    exit();
}

/**
 * 관리자권한이 존재하는지 확인한다.
 */
if ($me->getAdmin()->checkPermission('faqs') == false) {
    $results->success = false;
    $results->message = $me->getErrorText('FORBIDDEN');
    return;
}

$records = $me
    ->db()
    ->select(['faq_id', 'title'])
    ->from($me->table('faqs'))
    ->get();
foreach ($records as &$record) {
}

$results->success = true;
$results->records = $records;
