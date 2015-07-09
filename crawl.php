<?php

	$ids = preg_split('/$\R?^/m', trim($_POST['lines']));
	$lookedUp = array();
	$data = array();

	foreach ( $ids as $id ) {

		if ( !isset($lookedUp[$id]) ) {

			$content = file_get_contents("http://yugioh.wikia.com/wiki/" . $id);

			preg_match("/cardimage\" rowspan=\"91\"><a href=\"(.*?)alt=/" , $content, $output_array);

			$image = trim($output_array[1]);
			$image = explode('src="', $image);
			$image = explode('"', $image[1]);
			$image = $image[0];

			preg_match("/<td id=\"\" class=\"cardtablerowdata\" style=\";\">([^\<]+)/", $content, $output_array);
			$name = trim($output_array[1]);

			echo $name . '<br>';

			$lookedUp[$id] = array($name, $image);
		}

		$data[] = $lookedUp[$id];
	}

	echo 'Crawled ' . count($lookedUp) . ' / ' . count($data) . '<br>';

	echo '<br><textarea style="width: 500px;">' . json_encode($data) . '</textarea>';

		?>
<form method="post">
<textarea name="lines"></textarea>
<button>Ok</button>
</form>
